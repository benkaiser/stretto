export default class Theme {
  static initialise() {
    const theme = new Theme(localStorage.getItem('theme') || 'cerulean');
    theme.load();
  }

  static currentTheme() {
    return localStorage.getItem('theme') || 'cerulean';
  }

  static themes() {
    return [
      'cerulean',
      'cosmo',
      'cyborg',
      'darkly',
      'flatly',
      'journal',
      'lumen',
      'paper',
      'readable',
      'sandstone',
      'simplex',
      'slate',
      'spacelab',
      'superhero',
      'united',
      'yeti'
    ];
  }

  static themeAppColor() {
    return {
      cerulean: '#54b4eb',
      cosmo: '#222222',
      cyborg: '#060606',
      darkly: '#375a7f',
      flatly: '#2c3e50',
      journal: '#ffffff',
      lumen: '#f8f8f8',
      paper: '#ffffff',
      readable: '#ffffff',
      sandstone: '#3e3f3a',
      simplex: '#ffffff',
      slate: '#484e55',
      spacelab: '#fff',
      superhero: '#4e5d6c',
      united: '#e95420',
      yeti: '#333333'
    };
  }

  static themeOverrides() {
    const overrideNavbarColor = '@media (max-width: 767px) { .navbar .dropdown-menu a { color: #000; } }';
    return {
      cerulean: overrideNavbarColor,
      united: overrideNavbarColor,
    }
  }

  constructor(themeName) {
    this.name = themeName;
  }

  load() {
    localStorage.setItem('theme', this.name);
    document.getElementById('theme').href = `https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/${this.name}/bootstrap.min.css`;
    document.querySelector('meta[name=theme-color]').setAttribute('content', Theme.themeAppColor()[this.name]);
    const override = Theme.themeOverrides()[this.name] || '';
    document.getElementById('theme-overrides').innerHTML = override;
  }
}