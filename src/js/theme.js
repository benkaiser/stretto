export default class Theme {
  static initialise() {
    const theme = new Theme(Theme.currentTheme());
    theme.load();
  }

  static currentTheme() {
    const stored = localStorage.getItem('theme') || 'cerulean';
    // Some Bootswatch 3 themes (e.g. paper, readable) no longer exist in
    // Bootswatch 5; fall back to the default for any unknown theme.
    return Theme.themes().includes(stored) ? stored : 'cerulean';
  }

  static themes() {
    return [
      'cerulean',
      'cosmo',
      'cyborg',
      'darkly',
      'flatly',
      'journal',
      'litera',
      'lumen',
      'lux',
      'materia',
      'minty',
      'morph',
      'pulse',
      'quartz',
      'sandstone',
      'simplex',
      'sketchy',
      'slate',
      'solar',
      'spacelab',
      'superhero',
      'united',
      'vapor',
      'yeti',
      'zephyr'
    ];
  }

  static themeAppColor() {
    return {
      cerulean: '#2fa4e7',
      cosmo: '#2780e3',
      cyborg: '#060606',
      darkly: '#375a7f',
      flatly: '#2c3e50',
      journal: '#eb6864',
      litera: '#ffffff',
      lumen: '#158cba',
      lux: '#1a1a1a',
      materia: '#2196f3',
      minty: '#78c2ad',
      morph: '#378dfc',
      pulse: '#593196',
      quartz: '#e83283',
      sandstone: '#325d88',
      simplex: '#d9230f',
      sketchy: '#333333',
      slate: '#3a3f44',
      solar: '#002b36',
      spacelab: '#446e9b',
      superhero: '#4e5d6c',
      united: '#e95420',
      vapor: '#1a0933',
      yeti: '#008cba',
      zephyr: '#3459e6'
    };
  }

  static themeOverrides() {
    const overrideNavbarColor = '@media (max-width: 767px) { .navbar .dropdown-menu .dropdown-item { color: #000; } }';
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
    document.getElementById('theme').href = `https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/${this.name}/bootstrap.min.css`;
    document.querySelector('meta[name=theme-color]').setAttribute('content', Theme.themeAppColor()[this.name]);
    const override = Theme.themeOverrides()[this.name] || '';
    document.getElementById('theme-overrides').innerHTML = override;
  }
}
