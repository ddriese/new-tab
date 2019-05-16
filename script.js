const $search_input = document.querySelector('.search__input'),
      $weather = document.querySelector('.weather'),
      $weather_status = document.querySelector('.weather__status'),
      $weather_temperature = document.querySelector('.weather__temperature'),
      $thumbnails = document.querySelector('.thumbnails'),
      $settings_panel = document.querySelector('.settings'),
      $sites = document.querySelector('.settings__sites--sites'),

search = () => {
  let query = $search_input.value.split(' ').join('+');
  window.location.href = `https://www.startpage.com/do/dsearch?query=${query}&cat=web&pl=opensearch&language=english`;
},

load_weather = (latitude, longitude, settings) => {
  const proxy = 'https://cors-anywhere.herokuapp.com/',
        api = `${proxy}https://api.darksky.net/forecast/${settings.weather.key}/${latitude},${longitude}`;

  fetch(api).then(response => {
    return response.json();
  }).then(data => {
    const { icon, temperature, nearestStormDistance } = data.currently,
          { summary } = data.minutely;

    $weather.title = summary;
    $weather_temperature.textContent = `${Math.round(temperature)} °`;
    $weather_temperature.style.visibility = 'visible';
    $weather_temperature.style.opacity = 1;

    switch(icon) {
      case 'cloudy':
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/cloudy.svg" alt="Cloudy">';
        break;
      case 'rain':
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/rain.svg" alt="Rain">';
        break;
      case 'snow':
      case 'sleet':
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/snow.svg" alt="Snow / Sleet">';
        break;
      case 'partly-cloudy-day':
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/partly-cloudy-day.svg" alt="Partly Cloudy">';
        break;
      case 'partly-cloudy-night':
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/partly-cloudy-night.svg" alt="Partly Cloudy">';
        break;
      case 'clear-night':
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/clear-night.svg" alt="Clear Skies">';
        break;
      default:
        $weather_status.innerHTML = '<img class="weather__icon" src="/images/ui/weather/clear-day.svg" alt="Clear Skies">';
    }
  });
},

get_coordinates = (settings) => {
  if (settings) {
    if ('weather' in settings) {
      if (settings.weather.enabled) {
        $weather.title = 'Loading Weather...';
        $weather_status.innerHTML = '<div class="weather__loading"></div>';

        if (settings.weather.latitude && settings.weather.longitude) {
          load_weather(settings.weather.latitude, settings.weather.longitude, settings);
        }
        else {
          fetch('https://geoip-db.com/json/').then(response => {
            return response.json();
          }).then(location => {
            load_weather(location.latitude, location.longitude, settings);
          });
        }
      }
      else {
        $weather_status.textContent = '';
        $weather_temperature.textContent = '';
      }
    }
  }
},

load_thumbnails = (settings) => {
  if (settings) {
    if ('sites' in settings) {
      settings.sites.forEach((site, index) => {
        const $thumbnail = document.importNode(document.querySelector('#template-thumbnail').content, true).querySelector('.thumbnail'),
              $thumbnail_link = $thumbnail.querySelector('.thumbnail__link'),
              $thumbnail_image = $thumbnail.querySelector('.thumbnail__image'),
              $thumbnail_caption = $thumbnail.querySelector('.thumbnail__caption'),
              $preview_divider = document.querySelector('.preview__divider'),
              $preview_image = document.querySelector('.preview__image'),
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

          siblings.forEach(($sibling) => {
            $sibling.querySelector('.thumbnail__image').style.filter = 'blur(.5rem)';
          });
        });

        $thumbnail.addEventListener('mouseleave', () => {
          $thumbnail.style.borderColor = '#666';
          $thumbnail.style.backgroundColor = '#333';
          $thumbnail_link.style.borderColor = '#666';

          $preview_image.style.transform = 'translateY(50vh)';

          $preview_divider.style.width = '0';

          document.querySelectorAll('.thumbnail__image').forEach(($thumbnail_image) => {
            $thumbnail_image.style.filter = 'blur(0)';
          });
        });
      });
    }
  }
},
load_sites = (settings) => {
  sites = settings.sites;
  template = document.querySelector('#template-site').content

  $sites.innerHTML = "";  
  sites.forEach((site, index) => {
    const $site = document.importNode(template, true)
    if (site.name){
      $site.querySelector('.settings__heading').textContent = site.name;
    } else {
      $site.querySelector('.settings__heading').textContent = "A new site";
    }
    $site.querySelector('.setting__input--name').value = site.name;
    $site.querySelector('.setting__input--url').value = site.url;
    $site.querySelector('.setting__input--image').value = site.image;
    $site.querySelector('.setting__color').value = site.color;
    $site.querySelector('.setting--color').style.backgroundColor = site.color;

    $site.querySelector('.setting--color').addEventListener('change', event => {        
        event.currentTarget.style.backgroundColor = event.target.value;
      });
      
    $site.querySelector('.site__button--remove').addEventListener('click', (event) => {
      event.preventDefault();
      // Remove the site_settings that contains the triggered DOM
      document.querySelectorAll('.settings__site').forEach($site_settings => {
        if ($site_settings.contains(event.target)){
          $site_settings.remove();
        }
      });
    });

    $sites.appendChild($site);
  });


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
      Settings.load((settings) => {
        get_coordinates(settings);
        load_thumbnails(settings);
        close_settings();
      });
    });
  }

  static load(callback) {
    chrome.storage.local.get(['new_tab_settings'], result => {
      const settings = result.new_tab_settings;
      
      if (settings){
        document.querySelector('#weather__toggle').checked = settings.weather.enabled;
        document.querySelector('.setting__input--latitude').value = settings.weather.latitude;
        document.querySelector('.setting__input--longitude').value = settings.weather.longitude;
        document.querySelector('.setting__input--key').value = settings.weather.key;
        load_sites(settings);
      }
      callback(settings);
    });
  }
},

Weather = class {
  constructor(enabled, latitude, longitude, key) {
    this.enabled = enabled;
    this.latitude = latitude;
    this.longitude = longitude;
    this.key = key;
  }
},

Site = class {
  constructor(name, url, image, color) {
    this.name = name;
    this.url = url;
    this.color = color;
    this.image = image;
  }
},

show_settings = () => {
  Settings.load(() => {
    document.querySelectorAll('.setting__input--error').forEach($field => {
      $field.classList.remove('setting__input--error');
    });

    $settings_panel.style.visibility = 'visible';
    $settings_panel.style.opacity = 1;
  });
},

close_settings = () => {
  $settings_panel.style.visibility = 'hidden';
  $settings_panel.style.opacity = 0;
  setTimeout(() => { $settings_panel.scrollTop = 0; }, 500);
},
// Get current settings in settings panel
get_current_settings = (callback) => {
  const settings = new Settings();
  let error = false;
  
  document.querySelectorAll('.setting__input--error').forEach($field => {
    $field.classList.remove('setting__input--error');
  });
  
  const $weather_settings = document.querySelector('.settings__weather'),
        empty_fields = $weather_settings.querySelectorAll('.setting__input:invalid').length,
        weather = new Weather(
          document.querySelector('#weather__toggle').checked,
          $weather_settings.querySelector('.setting__input--latitude').value,
          $weather_settings.querySelector('.setting__input--longitude').value,
          $weather_settings.querySelector('.setting__input--key').value,
        );

  if (document.querySelector('#weather__toggle').checked) {
    if (!empty_fields) {
      settings.add_weather(weather);
    }
    else {
      $weather_settings.querySelectorAll('.setting__input:invalid').forEach(field => {
        field.classList.add('setting__input--error');
      });
      error = true;
    }
  }
  else {
    settings.add_weather(weather);
  }

  document.querySelectorAll('.settings__site').forEach($site_settings => {
    const fields = $site_settings.querySelectorAll('.setting__input').length,
          empty_fields = $site_settings.querySelectorAll('.setting__input:invalid').length,
          site = new Site(
            $site_settings.querySelector('.setting__input--name').value,
            $site_settings.querySelector('.setting__input--url').value,
            $site_settings.querySelector('.setting__input--image').value,
            $site_settings.querySelector('.setting__color').value
          );

    if (!empty_fields) {
      settings.add_site(site);
    }
    else if (empty_fields > 0 && empty_fields <= fields) {
      $site_settings.querySelectorAll('.setting__input:invalid').forEach(field => {
        field.classList.add('setting__input--error');
      });
      error = true;
    }
  });
  callback([settings,error])
},
save_settings = () => {
  get_current_settings(([settings,error])=>{
    if (!error) {
      settings.save();
    }
    else {
      $settings_panel.scrollTop = $settings_panel.offsetTop + document.querySelector('.setting__input--error').offsetTop - 50;
    }
  });
};

// EVENT LISTENERS
window.addEventListener('DOMContentLoaded', event => {
  Settings.load((settings) => {
    get_coordinates(settings);
    load_thumbnails(settings);
  });

  // Search Startpage
  $search_input.addEventListener('focus', (event) => {
    event.target.placeholder = '';
  });

  $search_input.addEventListener('blur', event => {
    event.target.placeholder = 'search';
  });

  $search_input.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.keyCode == 13) {
      key_pressed.preventDefault();
      search();
    }
  });

  document.querySelector('.search__button').addEventListener('click', () => {
    search();
  });

  // Show Settings
  document.querySelector('.settings__button--open').addEventListener('click', (event) => {
    event.preventDefault();
    show_settings();
  });

  // Save Settings
  document.querySelector('.settings__button--save').addEventListener('click', (event) => {
    event.preventDefault();
    save_settings();
  });

  document.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.target.classList.contains('setting__input')) {
      if (key_pressed.keyCode == 13) {
        key_pressed.preventDefault();
        save_settings();
      }
    }
  });

  // Close Settings
  document.querySelector('.settings__button--cancel').addEventListener('click', (event) => {
    event.preventDefault();
    close_settings();
  });

  document.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.keyCode == 27) {
      close_settings();
    }
  });

  // Add a blank site to settings panel's sites 
  document.querySelector('.sites__button--add').addEventListener('click', (event) => {
    event.preventDefault();

    get_current_settings(([current_settings,error])=>{
      if (!error){
        let new_settings = current_settings
        new_settings.sites = [new Site("","","","#913939"),...current_settings.sites];
        load_sites(new_settings);
      } else {
        $settings_panel.scrollTop = $settings_panel.offsetTop + document.querySelector('.setting__input--error').offsetTop - 50;
      }
    });
  });

});
