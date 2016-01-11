InfoView = Backbone.View.extend({
  template: '#current_info_template',
  render: function() {
    this.$el.html(render(this.template, {song: player.current_song}));
  },

  events: {
    'click .colsearch': 'triggerSearch',
    'click .info_cover': 'triggerCover',
    'click .info_options': 'triggerOptions',
  },
  triggerCover: function(ev) {
    showCover($(ev.target).attr('src'));
    return false;
  },

  triggerOptions: function(ev) {
    if (!optionsVisible) {
      // clear the options, they selected this indiviual item
      clearSelection();

      // add the current selection and display the options
      addToSelection(player.playing_id, false);
      createOptions(ev.clientX, ev.clientY);
    }

    return false;
  },

  triggerSearch: function(ev) {
    search = $(ev.target).text();
    player.updateSearch(search);
  },
});
