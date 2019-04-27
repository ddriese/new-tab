
const search_input = document.querySelector('.search__input'),

search = () => {
  let query = search_input.value.split(' ').join('+');
  window.location.href = 'https://www.startpage.com/do/dsearch?query=' + query + '&cat=web&pl=opensearch&language=english';
},

load_sites = () => {
  chrome.storage.local.get(['new_tab_settings'], result => {
    const settings = result.new_tab_settings,
          _site_template = document.querySelector('template');

    if (settings) {
      if ('sites' in settings) {
        settings.sites.forEach((site, index) => {
          const site_template = document.importNode(_site_template.content, true),
                thumbnail = site_template.querySelector('.thumbnail'),
                thumbnail_link = site_template.querySelector('.thumbnail__link'),
                preview_divider = document.querySelector('.preview__divider'),
                preview_image = document.querySelector('.preview__image');

          thumbnail_link.href = site.url;

          site_template.querySelector('.thumbnail__image').src = 'images/' + site.image;
          site_template.querySelector('.thumbnail__image').alt = site.name;

          site_template.querySelector('.thumbnail__caption').innerText = site.name;

          document.querySelector('.sites').appendChild(site_template);

          // Animations
          thumbnail.addEventListener('mouseover', () => {
            thumbnail.style.borderColor = site.color;
            thumbnail.style.backgroundColor = site.color;

            thumbnail_link.style.borderColor = site.color;

            preview_image.src = 'images/' + site.image;
            preview_image.alt = site.name.charAt(0).toUpperCase() + site.name.slice(1);
            preview_image.style.transform = 'translateY(calc(-50vh + 5px)';

            preview_divider.style.backgroundColor = site.color;
            preview_divider.style.width = '100%';
          });

          thumbnail.addEventListener('mouseout', () => {
            thumbnail.style.borderColor = '#666';
            thumbnail.style.backgroundColor = '#333';
            thumbnail_link.style.borderColor = '#666';

            preview_image.style.transform = 'translateY(50vh)';

            preview_divider.style.width = '0';
          });

          // Load Settings
          document.querySelectorAll('.site')[index].querySelector('.site__input--name').value = site.name;
          document.querySelectorAll('.site')[index].querySelector('.site__input--url').value = site.url;
          document.querySelectorAll('.site')[index].querySelector('.site__input--image').value = site.image;
          document.querySelectorAll('.site')[index].querySelector('.site__color').value = site.color;
        });

        document.querySelectorAll('.site__wrapper--color').forEach(color_container => {
          color_container.style.backgroundColor = color_container.querySelector('.site__color').value;

          color_container.querySelector('.site__color').addEventListener('change', event => {
            color_container.style.backgroundColor = event.target.value;
          });
        });
      }
    }
  });
},

settings_panel = document.querySelector('.settings'),

show_settings = () => {
    settings_panel.scrollTop = 0;
    settings_panel.style.visibility = 'visible';
    settings_panel.style.opacity = 1;
},

close_settings = () => {
  settings_panel.style.visibility = 'hidden';
  settings_panel.style.opacity = 0;
},

Settings = class {
  constructor() {
    this.sites = [];
  }

  add_site(site) {
    this.sites = [...this.sites, site];
  }

  save() {
    console.log(this);

    chrome.storage.local.set({ new_tab_settings: this }, () => {
      document.querySelector('.sites').innerHTML = '';
      load_sites();
      close_settings();
    });
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

  document.querySelectorAll('.site__input--error').forEach(field => {
    field.classList.remove('site__input--error');
  });

  document.querySelectorAll('.site').forEach(site => {
    const fields = site.querySelectorAll('.site__input').length,
          empty_fields = site.querySelectorAll('.site__input:invalid').length,
          site_object = new Site(
            site.querySelector('.site__input--name').value,
            site.querySelector('.site__input--url').value,
            site.querySelector('.site__input--image').value,
            site.querySelector('.site__color').value
          );

    if (!empty_fields) {
      settings.add_site(site_object);
    }
    else if (empty_fields > 0 && empty_fields < fields) {
      site.querySelectorAll('.site__input:invalid').forEach(field => {
        field.classList.add('site__input--error');
      });
      error = true;
    }
  });

  if (!error) {
    settings.save();
  }
  else {
    settings_panel.scrollTo({
      top: settings_panel.offsetTop + document.querySelector('.site__input--error').offsetTop - 50,
      left: 0,
      behavior: 'smooth'
    });
  }
};

// EVENT LISTENERS
window.addEventListener('DOMContentLoaded', event => {
  load_sites();

  // Search Startpage
  search_input.addEventListener('focus', (event) => {
    event.target.placeholder = '';
  });

  search_input.addEventListener('blur', event => {
    event.target.placeholder = 'search';
  });

  search_input.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.keyCode == 13) {
      key_pressed.preventDefault();
      search();
    }
  });

  document.querySelector('.search__button').addEventListener('click', () => {
    search();
  });

  // Show Settings
  document.querySelector('.button--settings').addEventListener('click', (event) => {
    event.preventDefault();
    show_settings();
  });

  // Save Settings
  document.querySelector('.settings__button--save').addEventListener('click', (event) => {
    event.preventDefault();
    save_settings();
  });

  document.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.target.classList.contains('site__input')) {
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

  document.addEventListener('keydown', (key_pressed) => {
    if (key_pressed.keyCode == 27) {
      close_settings();
    }
  });
});
