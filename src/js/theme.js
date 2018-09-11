class Theme {
  static initialise() {
    const theme = new Theme(localStorage.getItem('theme') || 'cerulean');
    theme.load();
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

  constructor(themeName) {
    this.name = themeName;
  }

  load() {
    localStorage.setItem('theme', this.name);
    document.getElementById('theme').href = `//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/${this.name}/bootstrap.min.css`;
  }
}

module.exports = Theme;
