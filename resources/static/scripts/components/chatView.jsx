/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "components/containers/chatViewFooter",
    "constants/propTypes",
    "gunpowder/utils/classes",
    "components/commons/viewHeader",
    "components/commons/dndWrapper"
  ],
  function (MessageList, ChatViewFooterContainer, PROP_TYPES, classes, ViewHeader, DnDWrapper) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        showAgentNickname: PropTypes.bool,
        isTyping: PropTypes.bool,
        browserIsMobile: PropTypes.bool,
        onMinimizeConversation: PropTypes.func,
        onFilesDrop: PropTypes.func.isRequired,
        onRetryAttachmentClick: PropTypes.func.isRequired,
        issueIsCreated: PropTypes.bool.isRequired,
        text: PropTypes.shape ({
          chatViewHeader: PropTypes.string.isRequired,
          dndInfoText: PropTypes.string.isRequired
        }).isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        })
      },

      render () {
        const {
          browserIsMobile,
          onMinimizeConversation,
          text,
          issueIsCreated,
          viewStyles
        } = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
            <ViewHeader title={text.chatViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            <DnDWrapper onDrop={this._onFilesDrop}
                        dragInfoText={text.dndInfoText}
                        enabled={issueIsCreated} >
              <div className="hs-view__content">
                <MessageList messages={this.props.messages}
                             isTyping={this.props.isTyping}
                             showAgentNickname={this.props.showAgentNickname}
                             text={this.props.text}
                             onRetryAttachmentClick={this.props.onRetryAttachmentClick}
                             onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
              </div>
              <ChatViewFooterContainer />
            </DnDWrapper>
          </div>
        );
      },

      /**
       * Handler for files dropped event
       * @param {Object} - files list array like object
       */
      _onFilesDrop (files) {
        this.props.onFilesDrop (files);
      }
    });
  }
);
