module Jekyll
  class CombinationPageGenerator < Generator
    safe true

    def generate(site)
      # Add debug logging to identify any problematic files
      Jekyll.logger.info("CombinationGenerator:", "Starting combination page generation")
      
      # Check the site source and destination directories
      Jekyll.logger.info("CombinationGenerator:", "Site source: #{site.source}")
      Jekyll.logger.info("CombinationGenerator:", "Site destination: #{site.dest}")
      
      # Load data from the YAML file instead of collections
      aiul_data_file = File.join(site.source, '_data', 'aiul.yml')
      unless File.exist?(aiul_data_file)
        Jekyll.logger.error("CombinationGenerator:", "aiul.yml not found at #{aiul_data_file}")
        return
      end
      
      require 'yaml'
      aiul_data = YAML.unsafe_load_file(aiul_data_file)
      
      # Extract licenses and modifiers from the data file
      licenses_data = aiul_data['licenses']['items'] || {}
      modifiers_data = aiul_data['modifiers']['items'] || {}
      
      # Debug info for data
      Jekyll.logger.info("CombinationGenerator:", "Found #{licenses_data.size} licenses and #{modifiers_data.size} modifiers")
      
      # Create a combinations directory if it doesn't exist
      FileUtils.mkdir_p(File.join(site.source, 'combinations')) unless Dir.exist?(File.join(site.source, 'combinations'))
      
      # Create a map to store all combinations for later reference
      combinations = {}
      
      # First pass: Generate all combination pages
      licenses_data.each do |license_key, license_data|
        license_title = license_data['title'] || "AIUL-#{license_key.upcase}"
        license_full_name = license_data['full_name'] || license_key
        license_description = license_data['description'] || "No description available"
        license_syllabus = license_data['syllabus_text'] || "No syllabus text available"
        license_when_to_use = license_data['when_to_use'] || []
        
        license_code = license_title.to_s.sub(/^AIUL-/, '')
        combinations[license_code] = {} unless combinations[license_code]
        
        modifiers_data.each do |modifier_key, modifier_data|
          modifier_code = modifier_data['code'] || modifier_key.upcase
          modifier_title = modifier_data['title'] || modifier_key.upcase
          modifier_full_name = modifier_data['full_name'] || modifier_key
          modifier_description = modifier_data['description'] || "No description available"
          modifier_example = modifier_data['example'] || "See the full modifier page for examples."
          
          # Skip combinations with missing data
          if license_code.empty? || modifier_code.empty?
            Jekyll.logger.warn("CombinationGenerator:", "Skipping combination with empty code: '#{license_code}' and '#{modifier_code}'")
            next
          end
          
          # Create a new page for this combination
          begin
            # Log the combination being created
            Jekyll.logger.info("CombinationGenerator:", "Generating combination: #{license_code}-#{modifier_code}")
            
            combination_page = CombinationPage.new(site, site.source, 'combinations', 
              {
                'title' => license_title,
                'full_name' => license_full_name,
                'description' => license_description,
                'syllabus_text' => license_syllabus,
                'when_to_use' => license_when_to_use
              },
              {
                'key' => modifier_key,
                'code' => modifier_code,
                'title' => modifier_title,
                'full_name' => modifier_full_name,
                'description' => modifier_description,
                'example' => modifier_example
              },
              true)
            
            # Store the combination page data for later reference
            combinations[license_code][modifier_code] = {
              'title' => combination_page.data['title'],
              'url' => combination_page.data['permalink'],
              'license_name' => license_full_name,
              'modifier_name' => modifier_full_name,
              'full_name' => "#{license_full_name} for #{modifier_full_name}"
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
      license_code = license['title'].to_s.sub(/^AIUL-/, '')
      modifier_code = modifier['code'] || modifier['title'].to_s
      modifier_key = modifier['key'] || modifier_code.downcase
      
      # Ensure these values aren't blank
      raise ArgumentError, "License code cannot be empty" if license_code.empty?
      raise ArgumentError, "Modifier code cannot be empty" if modifier_code.empty?
      
      # Set the filename with explicit extension
      @name = "#{license_code.downcase}-#{modifier_code.downcase}.html"
      
      # Ensure we have an extension
      Jekyll.logger.debug("CombinationPage:", "Creating page with name: #{@name}")
      
      # Define defaults for any potentially nil values
      license_name = license['full_name'] || license_code
      license_description = license['description'] || "No description available"
      license_syllabus = license['syllabus_text'] || "No syllabus text available"
      license_when_to_use = license['when_to_use'] || []
      
      modifier_name = modifier['full_name'] || modifier_code
      modifier_description = modifier['description'] || "No description available"
      modifier_example = modifier['example'] || "See the full modifier page for examples."
      
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
        'license_url' => "/licenses/#{license_code.downcase}/1.0.0/",
        'modifier_code' => modifier_code,
        'modifier_name' => modifier_name,
        'modifier_description' => modifier_description,
        'modifier_example' => modifier_example,
        'modifier_url' => "/modifiers/#{modifier_key}/1.0.0/",
        'combination_image_path' => "/assets/images/licenses/aiul-#{license_code.downcase}-#{modifier_code.downcase}.png",
        'permalink' => "/combinations/#{license_code.downcase}-#{modifier_code.downcase}.html"
      }
      
      # Explicitly set extension for Jekyll to avoid nil extension issues
      @ext = ".html"
      
      # These will be populated in the second pass
      @data['related_license_combinations'] = []
      @data['related_modifier_combinations'] = []
      
      # For now, skip the modifier content extraction since we're using hashes
      @data['modifier_applicable_tools_html'] = "<p>See the <a href=\"#{@data['modifier_url']}\">#{modifier_name} modifier page</a> for details.</p>"
      @data['modifier_considerations_html'] = "<p>See the <a href=\"#{@data['modifier_url']}\">#{modifier_name} modifier page</a> for details.</p>"
    end
  end
end