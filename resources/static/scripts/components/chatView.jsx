/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "components/containers/chatViewFooter",
    "components/containers/infoView",
    "components/commons/viewHeader",
    "components/commons/dndWrapper",
    "constants/propTypes"
  ],
  function (MessageList, ChatViewFooterContainer, InfoViewContainer, ViewHeader,
    DnDWrapper, customPropTypes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      MESSAGE_PROP_TYPE,
      USER_INPUT_PROP_TYPE
    } = customPropTypes;

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (MESSAGE_PROP_TYPE).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        showAgentNickname: PropTypes.bool,
        isTyping: PropTypes.bool,
        browserIsMobile: PropTypes.bool,
        onMinimizeConversation: PropTypes.func,
        onFilesDrop: PropTypes.func.isRequired,
        onRetryAttachmentClick: PropTypes.func.isRequired,
        userInput: USER_INPUT_PROP_TYPE,
        issueIsCreated: PropTypes.bool.isRequired,
        onPillOptionSelect: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          chatViewHeader: PropTypes.string.isRequired,
          dndInfoText: PropTypes.string.isRequired
        }).isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        loading: PropTypes.bool,
        /**
         * If chat view footer has any failure
         */
        hasFailure: PropTypes.bool
      },

      render () {
        const {
          browserIsMobile,
          onMinimizeConversation,
          text,
          viewStyles
        } = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
            <ViewHeader title={text.chatViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            {this._renderViewContents ()}
          </div>
        );
      },

      /**
       * Render view contents
       */
      _renderViewContents () {
        const {
          messages,
          isTyping,
          showAgentNickname,
          text,
          onPillOptionSelect,
          onRetryAttachmentClick,
          onSuggestedFaqClick,
          userInput,
          issueIsCreated,
          loading
        } = this.props;

        if (loading) {
          return (
            <InfoViewContainer />
          );
        }

        return (
          <DnDWrapper onDrop={this._onFilesDrop}
                      dragInfoText={text.dndInfoText}
                      enabled={issueIsCreated} >
              <div className="hs-view__content">
                <MessageList messages={messages}
                             isTyping={isTyping}
                             showAgentNickname={showAgentNickname}
                             text={text}
                             onPillOptionSelect={onPillOptionSelect}
                             onRetryAttachmentClick={onRetryAttachmentClick}
                             onSuggestedFaqClick={onSuggestedFaqClick}
                             hasFailure={this.props.hasFailure}
                             userInput={userInput} />
              </div>
              <ChatViewFooterContainer />
            </DnDWrapper>
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
