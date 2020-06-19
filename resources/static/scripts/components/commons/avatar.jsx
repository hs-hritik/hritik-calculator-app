/**
 * Component to show avatar
 * @author Riya Bagaria <riya@helpshift.com>
 * @created June 17, 2020
 * @module components/commons/avatar
 */

import classes from "gunpowder/utils/classes";
import {FALLBACK_AVATAR_BASE64} from "constants/avatar";
const DEFAULT_SIZE_IN_PX = 32;

class Avatar extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      avatarIsLoaded: false
    };
  }

  render() {
    const {showAvatar} = this.props;

    if (!showAvatar) {
      return null;
    }

    const {fallbackAvatar, avatarUrl, className, size} = this.props;
    const avatarStyles = {
      height: size,
      width: size
    };
    const avatarClasses = classes(className, "hs-avatar__avatar", {
      "hs-avatar__avatar--hidden": !this.state.avatarIsLoaded
    });
    const fallbackAvatarClasses = classes(className, "hs-avatar__avatar");
    let fallbackAvatarEl = null;

    if (!this.state.avatarIsLoaded) {
      fallbackAvatarEl = (
        <img
          src={fallbackAvatar}
          alt="Avatar Image"
          aria-hidden
          className={fallbackAvatarClasses}
          style={avatarStyles}
        />
      );
    }

    return (
      <>
        {fallbackAvatarEl}
        <img
          src={avatarUrl}
          alt="Avatar Image"
          className={avatarClasses}
          aria-hidden
          onLoad={this._onAvatarLoad.bind(this)}
          style={avatarStyles}
        />
      </>
    );
  }

  /**
   * On load handler for image
   */
  _onAvatarLoad() {
    this.setState({
      avatarIsLoaded: true
    });
  }
}

Avatar.defaultProps = {
  fallbackAvatar: FALLBACK_AVATAR_BASE64.APP,
  showAvatar: false,
  size: DEFAULT_SIZE_IN_PX
};

Avatar.propTypes = {
  /**
   * Fallback image to url when original image takes time to load
   */
  fallbackAvatar: PropTypes.string,
  /**
   * Url of the avatar
   */
  avatarUrl: PropTypes.string,
  /**
   * If true, render avatar
   */
  showAvatar: PropTypes.bool,
  /**
   * Extra classes
   */
  className: PropTypes.string,
  /**
   * Size of avatar image
   */
  size: PropTypes.number
};

export default Avatar;
