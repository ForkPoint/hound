/** @jsx React.DOM */


var defaultUrlParams = {
  file: ''
};

/**
 * The data model for the UI is responsible for displaying local files.
 */
var Model = {

  didError: new lib.Signal(),

  didLoadFile : new lib.Signal(),

  Load: function() {
    var _this = this;
    var params = lib.ParamsFromUrl(null, defaultUrlParams);

    if (params.file !== '') {
      $.ajax({
        url: '/api/v1/file',
        dataType: 'json',
        data : params,
        success: function(data) {
          _this.didLoadFile.raise(_this, data);
        },
        error: function(xhr, status, err) {
          _this.didError.raise(_this, err);
        }
      });
    } else {
      _this.didError.raise(_this, 'Missing required parameter "file"');
    }
  }

};

var App = React.createClass({
  componentWillMount: function() {
    this.setState({
      error : null,
      renderContent: null
    });

    var _this = this;
    Model.didLoadFile.tap(function(model, fileContent) {
      _this.setState({
          renderContent: fileContent
      });
    });

    Model.didError.tap(function(model, error) {
      _this.setState({
        error: error
      });
    });
  },

  componentDidUpdate : function() {
    hljs.initHighlighting();
  },

  render: function() {
    if(!!this.state.error) {
      return (
        <div class="error">
          {this.state.error}
        </div>
      );
    } else {
      return (
        <pre>
          <code>
            {this.state.renderContent}
          </code>
        </pre>
      );
    }
  }
});

React.renderComponent(
  <App />,
  document.getElementById('root')
);
Model.Load();
