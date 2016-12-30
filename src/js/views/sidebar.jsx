import { h, Component } from 'preact';
import { Link } from 'react-router';

class Sidebar extends Component {
  render() {
    return (
      <div class='sidebar'>
        <div class='sidebar-top'>
          <h3 class='logo'><Link to='/' style={{ textDecoration: 'none' }}>Stretto</Link></h3>
          <ul class='nav nav-pills nav-stacked'>
            <li class="dropdown-header">Find Music</li>
            <li><a href="#">Explore</a></li>
            <li class="dropdown-header">Your Music</li>
            <li><a href="#">Library</a></li>
            <li><a href="#">First Playlist</a></li>
          </ul>
        </div>
        <div class='sidebar-bottom'>
          <Link class='btn btn-info btn-block' to='/settings'>
            <span class='glyphicon glyphicon-cog' aria-hidden='true'></span>
            {" "}Settings
          </Link>
        </div>
      </div>
    );
  }
}

module.exports = Sidebar;
