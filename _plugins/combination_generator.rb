module Jekyll
  class CombinationPageGenerator < Generator
    safe true

    def generate(site)
      # Add debug logging to identify any problematic files
      Jekyll.logger.info("CombinationGenerator:", "Starting combination page generation")
      
      # Check the site source and destination directories
      Jekyll.logger.info("CombinationGenerator:", "Site source: #{site.source}")
      Jekyll.logger.info("CombinationGenerator:", "Site destination: #{site.dest}")
      
      # Get all licenses and modifiers from their collections
      licenses = site.collections['licenses'].docs
      modifiers = site.collections['modifiers'].docs
      
      # Debug info for collections
      Jekyll.logger.info("CombinationGenerator:", "Found #{licenses.size} licenses and #{modifiers.size} modifiers")
      
      # Log collection items with paths for debugging
      licenses.each { |l| Jekyll.logger.info("CombinationGenerator:", "License: #{l.path} - #{l.data['title']}") }
      modifiers.each { |m| Jekyll.logger.info("CombinationGenerator:", "Modifier: #{m.path} - #{m.data['title']}") }
      
      # Create a combinations directory if it doesn't exist
      FileUtils.mkdir_p(File.join(site.source, 'combinations')) unless Dir.exist?(File.join(site.source, 'combinations'))
      
      # Create a map to store all combinations for later reference
      combinations = {}
      
      # First pass: Generate all combination pages
      licenses.each do |license|
        # Skip if title is missing
        next unless license.data['title']
        
        license_code = license.data['title'].to_s.sub(/^AIUL-/, '')
        combinations[license_code] = {} unless combinations[license_code]
        
        modifiers.each do |modifier|
          # Skip if title is missing
          next unless modifier.data['title']
          
          modifier_code = modifier.data['title'].to_s
          
          # Skip combinations with missing data
          if license_code.empty? || modifier_code.empty?
            Jekyll.logger.warn("CombinationGenerator:", "Skipping combination with empty code: '#{license_code}' and '#{modifier_code}'")
            next
          end
          
          # Create a new page for this combination
          begin
            # Log the combination being created
            Jekyll.logger.info("CombinationGenerator:", "Generating combination: #{license_code}-#{modifier_code}")
            
            combination_page = CombinationPage.new(site, site.source, 'combinations', license, modifier, true)
            
            # Store the combination page data for later reference
            combinations[license_code][modifier_code] = {
              'title' => combination_page.data['title'],
              'url' => combination_page.data['permalink'],
              'license_name' => license.data['full_name'] || license_code,
              'modifier_name' => modifier.data['full_name'] || modifier_code,
              'full_name' => "#{license.data['full_name'] || license_code} for #{modifier.data['full_name'] || modifier_code}"
            }
            
            # Add the page to the site's pages
            site.pages << combination_page
          rescue => e
            Jekyll.logger.error("CombinationGenerator:", "Error generating combination page for #{license_code}-#{modifier_code}: #{e.message}")
            Jekyll.logger.error("CombinationGenerator:", e.backtrace.join("\n"))
          end
        end
      end
      
      # Second pass: Update each combination with related combinations
      site.pages.each do |page|
        next unless page.data['layout'] == 'combination'
        
        # Extract codes from the page title
        match = page.data['title'].to_s.match(/AIUL-([A-Z]+)-([A-Z0-9]+)/)
        next unless match
        
        license_code = match[1]
        modifier_code = match[2]
        
        # Skip if no matching combinations exist
        next unless combinations[license_code] && combinations[license_code][modifier_code]
        
        # Populate related license combinations (same license, different modifiers)
        page.data['related_license_combinations'] = []
        if combinations[license_code]
          combinations[license_code].each do |mod_code, combo|
            next if mod_code == modifier_code # Skip the current combination
            page.data['related_license_combinations'] << combo
          end
        end
        
        # Populate related modifier combinations (same modifier, different licenses)
        page.data['related_modifier_combinations'] = []
        combinations.each do |lic_code, modifiers|
          next if lic_code == license_code # Skip the current license
          if modifiers && modifiers[modifier_code]
            page.data['related_modifier_combinations'] << modifiers[modifier_code]
          end
        end
      end
      
      Jekyll.logger.info("CombinationGenerator:", "Completed generating #{combinations.values.sum { |v| v.size }} combination pages")
    end
  end

  # Class representing a combination page
  class CombinationPage < Page
    def initialize(site, base, dir, license, modifier, use_versioned_layout = false)
      @site = site
      @base = base
      @dir = dir
      
      # Safely extract codes and ensure they're strings
      license_code = license.data['title'].to_s.sub(/^AIUL-/, '')
      modifier_code = modifier.data['title'].to_s
      
      # Ensure these values aren't blank
      raise ArgumentError, "License code cannot be empty" if license_code.empty?
      raise ArgumentError, "Modifier code cannot be empty" if modifier_code.empty?
      
      # Set the filename with explicit extension
      @name = "#{license_code.downcase}-#{modifier_code.downcase}.html"
      
      # Ensure we have an extension
      Jekyll.logger.debug("CombinationPage:", "Creating page with name: #{@name}")
      
      # Define defaults for any potentially nil values
      license_name = license.data['full_name'] || license_code
      license_description = license.data['description'] || "No description available"
      license_syllabus = license.data['syllabus_text'] || "No syllabus text available"
      license_when_to_use = license.data['when_to_use'] || []
      
      modifier_name = modifier.data['full_name'] || modifier_code
      modifier_description = modifier.data['description'] || "No description available"
      modifier_example = modifier.data['example_use_cases'] || "See the full modifier page for examples."
      
      # Choose layout based on flag
      layout = use_versioned_layout ? 'combination-versioned' : 'combination'
      
      # Set up the front matter data with nil checks
      @data = {
        'layout' => layout,
        'title' => "AIUL-#{license_code}-#{modifier_code}",
        'license_code' => "AIUL-#{license_code}",
        'license_name' => license_name,
        'license_description' => license_description,
        'license_syllabus' => license_syllabus,
        'license_when_to_use' => license_when_to_use,
        'license_url' => license.url,
        'modifier_code' => modifier_code,
        'modifier_name' => modifier_name,
        'modifier_description' => modifier_description,
        'modifier_example' => modifier_example,
        'modifier_url' => modifier.data['permalink'] || modifier.url,
        'combination_image_path' => "/assets/images/licenses/aiul-#{license_code.downcase}-#{modifier_code.downcase}.png",
        'permalink' => "/combinations/#{license_code.downcase}-#{modifier_code.downcase}.html"
      }
      
      # Explicitly set extension for Jekyll to avoid nil extension issues
      @ext = ".html"
      
      # These will be populated in the second pass
      @data['related_license_combinations'] = []
      @data['related_modifier_combinations'] = []
      
      # Extract HTML content from modifier's markdown for the section content
      # This parses the content to extract the "Applicable Tools" and "Considerations" sections
      modifier_content = modifier.content.to_s
      
      # Extract Applicable Tools section
      if modifier_content =~ /#{Regexp.escape('### Applicable Tools')}(.*?)(?=###|\z)/m
        applicable_tools_content = $1.strip
        @data['modifier_applicable_tools_html'] = "<ul>\n#{applicable_tools_content.gsub(/^- /, '<li>').gsub(/^/, '  ').gsub(/(?<!<\/li>)$/, '</li>')}\n</ul>"
      else
        @data['modifier_applicable_tools_html'] = "<p>See the <a href=\"#{modifier.url}\">#{modifier.data['title']} modifier page</a> for details.</p>"
      end
      
      # Extract Considerations section
      if modifier_content =~ /#{Regexp.escape('### Considerations')}(.*?)(?=###|\z)/m
        considerations_content = $1.strip
        @data['modifier_considerations_html'] = "<ul>\n#{considerations_content.gsub(/^- /, '<li>').gsub(/^/, '  ').gsub(/(?<!<\/li>)$/, '</li>')}\n</ul>"
      else
        @data['modifier_considerations_html'] = "<p>See the <a href=\"#{modifier.url}\">#{modifier.data['title']} modifier page</a> for details.</p>"
      end
    end
  end
end