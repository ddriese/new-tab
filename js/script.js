
const $search_input = document.querySelector('.search__input'),

search = () => {
  let query = $search_input.value.split(' ').join('+');
  window.location.href = `https://www.startpage.com/do/dsearch?query=${query}&cat=web&pl=opensearch&language=english`;
},

load_weather = (settings) => {
  if (settings) {
    if ('weather' in settings) {
      if (settings.weather.enabled) {
        const proxy = 'https://cors-anywhere.herokuapp.com/',
              api = `${proxy}https://api.darksky.net/forecast/${settings.weather.key}/${settings.weather.latitude},${settings.weather.longitude}`;

        document.querySelector('.weather__temperature').innerHTML = '<img class="weather__loading" src="images/ui/loading.svg">';

        fetch(api).then(response => {
          return response.json();
        }).then(data => {
          const {icon, temperature, summary} = data.currently;

          document.querySelector('.weather__temperature').textContent = `${Math.round(temperature)} °`;
          document.querySelector('.weather__summary').textContent = summary;
        });

        // Display settings in Settings Panel
        document.querySelector('#weather__toggle').checked = true;
        document.querySelector('.setting__input--latitude').value = settings.weather.latitude;
        document.querySelector('.setting__input--longitude').value = settings.weather.longitude;
        document.querySelector('.setting__input--key').value = settings.weather.key;
      }
      else {
        document.querySelector('.weather__temperature').textContent = '';
        document.querySelector('.weather__summary').textContent = '';

        // Display settings in Settings Panel
        document.querySelector('#weather__toggle').checked = false;
        document.querySelector('.setting__input--latitude').value = settings.weather.latitude;
        document.querySelector('.setting__input--longitude').value = settings.weather.longitude;
        document.querySelector('.setting__input--key').value = settings.weather.key;
      }
    }
  }
},

load_sites = (settings) => {
  const $site_template = document.querySelector('template');

  if (settings) {
    if ('sites' in settings) {
      settings.sites.forEach((site, index) => {
        const site_template = document.importNode($site_template.content, true),
              $thumbnail = site_template.querySelector('.thumbnail'),
              $thumbnail_link = site_template.querySelector('.thumbnail__link'),
              $preview_divider = document.querySelector('.preview__divider'),
              $preview_image = document.querySelector('.preview__image'),
              image_source = site.image.includes('://') ? site.image : `images/${site.image}`;

        $thumbnail_link.href = site.url;

        site_template.querySelector('.thumbnail__image').src = image_source;
        site_template.querySelector('.thumbnail__image').alt = site.name;

        site_template.querySelector('.thumbnail__caption').innerText = site.name;

        if (index + 1 <= 5) {
          document.querySelector('.sites').style.gridTemplateColumns = `repeat(${index + 1}, calc(20% - 2rem))`;
        }

        document.querySelector('.sites').appendChild(site_template);

        // Animations
        $thumbnail.addEventListener('mouseover', () => {
          $thumbnail.style.borderColor = site.color;
          $thumbnail.style.backgroundColor = site.color;

          $thumbnail_link.style.borderColor = site.color;

          $preview_image.src = image_source;
          $preview_image.alt = site.name.charAt(0).toUpperCase() + site.name.slice(1);
          $preview_image.style.transform = 'translateY(calc(-50vh + .5rem)';

          $preview_divider.style.backgroundColor = site.color;
          $preview_divider.style.width = '100%';
        });

        $thumbnail.addEventListener('mouseout', () => {
          $thumbnail.style.borderColor = '#666';
          $thumbnail.style.backgroundColor = '#333';
          $thumbnail_link.style.borderColor = '#666';

          $preview_image.style.transform = 'translateY(50vh)';

          $preview_divider.style.width = '0';
        });

        // Display settings in Settings Panel
        document.querySelectorAll('.settings__site')[index].querySelector('.setting__input--name').value = site.name;
        document.querySelectorAll('.settings__site')[index].querySelector('.setting__input--url').value = site.url;
        document.querySelectorAll('.settings__site')[index].querySelector('.setting__input--image').value = site.image;
        document.querySelectorAll('.settings__site')[index].querySelector('.setting__color').value = site.color;
      });

      document.querySelectorAll('.setting--color').forEach($color_container => {
        $color_container.style.backgroundColor = $color_container.querySelector('.setting__color').value;

        $color_container.querySelector('.setting__color').addEventListener('change', event => {
          $color_container.style.backgroundColor = event.target.value;
        });
      });
    }
  }
},

$settings_panel = document.querySelector('.settings'),

show_settings = () => {
    $settings_panel.style.visibility = 'visible';
    $settings_panel.style.opacity = 1;
},

close_settings = () => {
  $settings_panel.style.visibility = 'hidden';
  $settings_panel.style.opacity = 0;
  setTimeout(() => { $settings_panel.scrollTop = 0; }, 500);
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
      document.querySelector('.sites').innerHTML = '';
      Settings.load((settings) => {
        load_weather(settings);
        load_sites(settings);
        close_settings();
      });
    });
  }

  static load(callback) {
    chrome.storage.local.get(['new_tab_settings'], result => {
      const settings = result.new_tab_settings;
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

save_settings = () => {
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
    else if (empty_fields > 0 && empty_fields < fields) {
      $site_settings.querySelectorAll('.setting__input:invalid').forEach(field => {
        field.classList.add('setting__input--error');
      });
      error = true;
    }
  });

  if (!error) {
    settings.save();
  }
  else {
    $settings_panel.scrollTop = $settings_panel.offsetTop + document.querySelector('.setting__input--error').offsetTop - 50;
  }
};

// EVENT LISTENERS
window.addEventListener('DOMContentLoaded', event => {
  Settings.load((settings) => {
    load_weather(settings);
    load_sites(settings);
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
  document.querySelector('.settings__button--close').addEventListener('click', (event) => {
    event.preventDefault();
    close_settings();
  });

  $settings_panel.addEventListener('click', (event) => {
    if (event.target == $settings_panel) { close_settings(); }
  });

  document.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.keyCode == 27) {
      close_settings();
    }
  });
});
