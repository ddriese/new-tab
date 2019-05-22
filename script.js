const $search_input = document.querySelector('.search-input'),
      $weather = document.querySelector('.weather'),
      $weather_status = document.querySelector('.weather-status'),
      $weather_temperature = document.querySelector('.weather-temperature'),
      $thumbnails = document.querySelector('.thumbnails'),
      $settings_panel = document.querySelector('.settings-panel'),
      $site_settings_template = document.querySelector('.site-settings-template').content,

display_weather = async settings => {
  if (settings) {
    if ('weather' in settings) {
      const { enabled, latitude, longitude, key } = settings.weather;

      if (enabled) {
        $weather.title = 'Loading Weather...';
        $weather_status.innerHTML = '<div class="loading-icon"></div>';

        const coordinates = await get_coordinates(latitude, longitude),
              weather_data = await load_weather(coordinates.latitude, coordinates.longitude, key),
              { icon, temperature } = weather_data.currently,
              { summary } = weather_data.minutely,
              $weather_icon = document.createElement('img');

        $weather.title = summary;
        $weather_temperature.textContent = `${Math.round(temperature)} °`;
        $weather_temperature.style.visibility = 'visible';
        $weather_temperature.style.opacity = 1;

        $weather_icon.classList.add('weather-icon');
        $weather_icon.src = '/images/ui/weather/';

        switch(icon) {
          case 'cloudy':
            $weather_icon.src += 'cloudy.svg';
            break;
          case 'fog':
            $weather_icon.src += 'fog.svg';
            break;
          case 'rain':
            $weather_icon.src += 'rain.svg';
            break;
          case 'snow':
          case 'sleet':
            $weather_icon.src += 'snow.svg';
            break;
          case 'partly-cloudy-day':
            $weather_icon.src += 'partly-cloudy-day.svg';
            break;
          case 'partly-cloudy-night':
            $weather_icon.src += 'partly-cloudy-night.svg';
            break;
          case 'clear-night':
            $weather_icon.src += 'clear-night.svg';
            break;
          default:
            $weather_icon.src += 'clear-day.svg';
        }

        $weather_status.replaceChild($weather_icon, document.querySelector('.loading-icon'));
      }
      else {
        $weather_status.textContent = '';
        $weather_temperature.textContent = '';
      }
    }
  }
},

get_coordinates = (latitude, longitude) => {
  return new Promise(resolve => {
    const coordinates = [];

    if (latitude && longitude) {
      coordinates.latitude = latitude;
      coordinates.longitude = longitude;
      resolve(coordinates);
    }
    else {
      fetch('https://geoip-db.com/json/').then(response => {
        return response.json();
      }).then(location => {
        coordinates.latitude = location.latitude;
        coordinates.longitude = location.longitude;
        resolve(coordinates);
      });
    }
  });
},

load_weather = (latitude, longitude, key) => {
  return new Promise(resolve => {
    const proxy = 'https://cors-anywhere.herokuapp.com/';

    fetch(`${proxy}https://api.darksky.net/forecast/${key}/${latitude},${longitude}`).then(response => {
      resolve(response.json());
    });
  });
}

display_thumbnails = settings => {
  if (settings) {
    if ('sites' in settings) {
      settings.sites.forEach((site, index) => {
        const $thumbnail = document.importNode(document.querySelector('.thumbnail-template').content, true).querySelector('.thumbnail'),
              $thumbnail_link = $thumbnail.querySelector('.thumbnail-link'),
              $thumbnail_image = $thumbnail.querySelector('.thumbnail-image'),
              $thumbnail_caption = $thumbnail.querySelector('.thumbnail-caption'),
              $preview_divider = document.querySelector('.preview-divider'),
              $preview_image = document.querySelector('.preview-image'),
              image_source = site.image.includes('://') ? site.image : `/images/${site.image}`;

        $thumbnail_link.href = site.url;
        $thumbnail_image.src = image_source;
        $thumbnail_image.alt = site.name;
        $thumbnail_caption.innerText = site.name;

        if (index + 1 <= 5) {
          $thumbnails.style.gridTemplateColumns = `repeat(${index + 1}, calc(20% - 2rem))`;
        }

        $thumbnails.appendChild($thumbnail);

        // Animations
        $thumbnail.addEventListener('mouseenter', () => {
          const siblings = Array.from($thumbnail.parentNode.children).filter(el => el !== $thumbnail);

          $thumbnail.style.borderColor = site.color;
          $thumbnail.style.backgroundColor = site.color;
          $thumbnail_link.style.borderColor = site.color;

          $preview_image.src = image_source;
          $preview_image.alt = site.name;
          $preview_image.style.transform = 'translateY(calc(-50vh + .5rem)';

          $preview_divider.style.backgroundColor = site.color;
          $preview_divider.style.width = '100%';

          siblings.forEach($sibling => {
            $sibling.querySelector('.thumbnail-image').style.filter = 'blur(.5rem)';
          });
        });

        $thumbnail.addEventListener('mouseleave', () => {
          $thumbnail.style.borderColor = '#666';
          $thumbnail.style.backgroundColor = '#333';
          $thumbnail_link.style.borderColor = '#666';

          $preview_image.style.transform = 'translateY(50vh)';

          $preview_divider.style.width = '0';

          document.querySelectorAll('.thumbnail-image').forEach($thumbnail_image => {
            $thumbnail_image.style.filter = 'blur(0)';
          });
        });
      });
    }
  }
},

search = () => {
  let query = $search_input.value.split(' ').join('+');
  window.location.href = `https://www.startpage.com/do/dsearch?query=${query}&cat=web&pl=opensearch&language=english`;
},

show_settings = () => {
  document.querySelectorAll('.error').forEach($field => {
    $field.classList.remove('error');
  });

  $settings_panel.style.visibility = 'visible';
  $settings_panel.style.opacity = 1;
},

add_new_site = () => {
  const $site_settings = document.importNode($site_settings_template, true).querySelector('.site-settings');

  $site_settings.querySelector('h2').innerText = 'New Site';
  document.querySelector('.sites').appendChild($site_settings);
  $settings_panel.scrollTop = $site_settings.offsetTop + $site_settings.clientHeight;

  add_color_picker_listener($site_settings);
  count_sites();
},

count_sites = () => {
  if (document.querySelectorAll('.site-settings').length < 5) {
    document.querySelector('.add-site-button').style.opacity = 1;
    document.querySelector('.add-site-button').style.visibility = 'visible';

    if (document.querySelectorAll('.site-settings').length == 0) {
      add_new_site();
    }
  }
  else {
    document.querySelector('.add-site-button').style.opacity = 0;
    document.querySelector('.add-site-button').style.visibility = 'hidden';
  }
},

add_color_picker_listener = $site_settings => {
  $site_settings.querySelector('.color-input').addEventListener('change', () => {
    $site_settings.querySelector('.color').style.background = $site_settings.querySelector('.color-input').value;
  });
},

close_settings = () => {
  $settings_panel.style.visibility = 'hidden';
  $settings_panel.style.opacity = 0;
  Settings.load();
  setTimeout(() => { $settings_panel.scrollTop = 0; }, 500);
},

save_settings = () => {
  let validation_error = false;

  const settings = new Settings(),
        $weather_settings = document.querySelector('.weather-settings'),
        empty_fields = $weather_settings.querySelectorAll(':invalid').length,
        weather = {
          'enabled': document.querySelector('#weather-toggle').checked,
          'latitude': $weather_settings.querySelector('.latitude').value,
          'longitude': $weather_settings.querySelector('.longitude').value,
          'key': $weather_settings.querySelector('.key').value,
        };

  document.querySelectorAll('.error').forEach($field => {
    $field.classList.remove('error');
  });

  if (document.querySelector('#weather-toggle').checked) {
    if (!empty_fields) {
      settings.add_weather(weather);
    }
    else {
      $weather_settings.querySelectorAll(':invalid').forEach($field => {
        $field.classList.add('error');
      });
      validation_error = true;
    }
  }
  else {
    settings.add_weather(weather);
  }

  document.querySelectorAll('.site-settings').forEach($site_settings => {
    const fields = $site_settings.querySelectorAll('input[type=text]').length,
          empty_fields = $site_settings.querySelectorAll(':invalid').length,
          site = {
            'name': $site_settings.querySelector('.site-name').value,
            'url': $site_settings.querySelector('.site-url').value,
            'image': $site_settings.querySelector('.site-image').value,
            'color': $site_settings.querySelector('.color-input').value
          };

    if (!empty_fields) {
      settings.add_site(site);
    }
    else if (empty_fields > 0 && empty_fields < fields) {
      $site_settings.querySelectorAll(':invalid').forEach(field => {
        field.classList.add('error');
      });
      validation_error = true;
    }
  });

  if (!validation_error) {
    settings.save();
  }
  else {
    $settings_panel.scrollTop = $settings_panel.offsetTop + document.querySelector('.error').offsetTop - 50;
  }
},

Settings = class {
  constructor() {
    this.sites = [];
  }

  add_weather(weather) {
    this.weather = weather;
  }

  add_site(site) {
    this.sites = [...this.sites, site];
  }

  save() {
    chrome.storage.local.set({ new_tab_settings: this }, () => {
      $thumbnails.innerHTML = '';
      display_weather(this);
      display_thumbnails(this);
      close_settings();
    });
  }

  static load(callback) {
    chrome.storage.local.get(['new_tab_settings'], result => {
      const settings = result.new_tab_settings;

      if (settings) {
        if ('weather' in settings) {
          document.querySelector('#weather-toggle').checked = settings.weather.enabled;
          document.querySelector('.latitude').value = settings.weather.latitude;
          document.querySelector('.longitude').value = settings.weather.longitude;
          document.querySelector('.key').value = settings.weather.key;
        }

        if ('sites' in settings) {
          document.querySelector('.sites').innerHTML = '';

          settings.sites.forEach((site) => {
            const $site_settings = document.importNode($site_settings_template, true).querySelector('.site-settings');

            $site_settings.querySelector('h2').innerText = site.name;
            $site_settings.querySelector('.site-name').value = site.name;
            $site_settings.querySelector('.site-url').value = site.url;
            $site_settings.querySelector('.site-image').value = site.image;
            $site_settings.querySelector('.color-input').value = site.color;
            $site_settings.querySelector('.color').style.background = site.color;

            document.querySelector('.sites').appendChild($site_settings);

            add_color_picker_listener($site_settings);
          });
        }
      }

      count_sites();

      typeof callback === 'function' && callback(settings);
    });
  }
};


// EVENT LISTENERS
window.addEventListener('DOMContentLoaded', event => {
  Settings.load((settings) => {
    display_weather(settings);
    display_thumbnails(settings);
  });

  // Search
  $search_input.addEventListener('focus', event => {
    event.target.placeholder = '';
  });

  $search_input.addEventListener('blur', event => {
    event.target.placeholder = 'search';
  });

  $search_input.addEventListener('keydown', key_pressed => {
    if (key_pressed.keyCode == 13) {
      key_pressed.preventDefault();
      search();
    }
  });

  document.querySelector('.search-button').addEventListener('click', () => {
    search();
  });

  // Show Settings
  document.querySelector('.open-settings-button').addEventListener('click', event => {
    event.preventDefault();
    show_settings();
  });

  // Save Settings
  document.querySelector('.save-settings-button').addEventListener('click', event => {
    event.preventDefault();
    save_settings();
  });

  document.addEventListener('keydown', key_pressed => {
    if (key_pressed.target.nodeName == 'INPUT') {
      if (key_pressed.keyCode == 13) {
        key_pressed.preventDefault();
        save_settings();
      }
    }
  });

  // Close Settings
  document.querySelector('.cancel-settings-button').addEventListener('click', event => {
    event.preventDefault();
    close_settings();
  });

  document.addEventListener('keydown', key_pressed => {
    if (key_pressed.keyCode == 27) {
      close_settings();
    }
  });

  // Add a Site to Settings Panel
  document.querySelector('.add-site-button').addEventListener('click', () => {
    if (document.querySelectorAll('.site-settings').length < 5) {
      add_new_site();
    }
  });

  // Remove a Site from Settings Panel
  document.body.addEventListener('click', event => {
    if (event.target.classList.contains('remove-site-button')) {
      document.querySelectorAll('.site-settings').forEach($site_settings => {
        if ($site_settings.contains(event.target)) {
          $site_settings.style.opacity = 0;

          setTimeout(() => {
            $site_settings.remove();
            count_sites();
          }, 350);
        }
      });
    }
  });
});
