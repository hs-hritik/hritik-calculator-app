/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "components/jumpToLatestBtn",
    "components/containers/chatViewFooter",
    "components/infoView",
    "components/commons/viewHeader",
    "components/commons/dndWrapper",
    "constants/propTypes",
    "gunpowder/utils/classes"
  ],
  function (MessageList, JumpToLatestBtn, ChatViewFooterContainer, InfoView, ViewHeader,
    DnDWrapper, customPropTypes, classes) {
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
        userIsViewingPastMessages: PropTypes.bool,
        browserIsMobile: PropTypes.bool,
        onMinimizeConversation: PropTypes.func,
        onScrollPastExistingConversation: PropTypes.func,
        onLoadMore: PropTypes.func,
        onFilesDrop: PropTypes.func.isRequired,
        onRetryAttachmentClick: PropTypes.func.isRequired,
        userInput: USER_INPUT_PROP_TYPE,
        issueIsCreated: PropTypes.bool.isRequired,
        onPillOptionSelect: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          chatViewHeader: PropTypes.string.isRequired,
          dndInfoText: PropTypes.string.isRequired,
          pastConversationsLoadingText: PropTypes.string.isRequired
        }).isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        loading: PropTypes.bool,
        pastConversationsLoading: PropTypes.bool,
        allMessagesAreLoaded: PropTypes.bool,
        /**
         * If chat view footer has any failure
         */
        hasFailure: PropTypes.bool,
        error: PropTypes.shape ({
          // Error title
          title: PropTypes.string.isRequired,
          // Error subtitle
          subtitle: PropTypes.string,
          // Call to action text for the error. eg. Retry
          cta: PropTypes.string
        }),
        errorActionHandler: PropTypes.func
      },

      getInitialState () {
        return {
          showJumpToLatestBtn: false
        };
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

      _renderLoader () {
        const {
          pastConversationsLoading,
          text: {
            pastConversationsLoadingText
          }
        } = this.props;

        if (!pastConversationsLoading) {
          return null;
        }

        const loaderClasses = classes (
          "ion-load-b",
          "ion--spinning",
          "hs-chat-view__msgs-loader-spinner"
        );

        return (
          <div className="hs-chat-view__msgs-loader-container">
            <i className={loaderClasses} />
            <span>{pastConversationsLoadingText}</span>
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
          loading,
          error,
          errorActionHandler
        } = this.props;

        if (loading || (error && error.title)) {
          return (
            <InfoView loading={loading}
                      title={error.title}
                      subtitle={error.subtitle}
                      actionBtnText={error.cta}
                      onActionBtnClick={errorActionHandler} />
          );
        }

        return (
          <DnDWrapper onDrop={this._onFilesDrop}
                      dragInfoText={text.dndInfoText}
                      enabled={issueIsCreated}>
              {this._renderLoader ()}
              <div className="hs-view__content">
                <MessageList messages={messages}
                             isTyping={isTyping}
                             showAgentNickname={showAgentNickname}
                             text={text}
                             onPillOptionSelect={onPillOptionSelect}
                             onRetryAttachmentClick={onRetryAttachmentClick}
                             onSuggestedFaqClick={onSuggestedFaqClick}
                             hasFailure={this.props.hasFailure}
                             userInput={userInput}
                             userIsViewingPastMessages={this.props.userIsViewingPastMessages}
                             onScrollPastExistingConversation={
                               this._onScrollPastExistingConversation
                             }
                             onLoadMore={this._onLoadMore}
                             ref={this._setMsgListRef} />
                  <JumpToLatestBtn show={this.state.showJumpToLatestBtn}
                                   onClick={this._onJumpBtnClick} />
              </div>
              <ChatViewFooterContainer />
            </DnDWrapper>
        );
      },

      _msgListRef: null,

      _onJumpBtnClick () {
        this._msgListRef._animatedScrollToBottom ();
      },

      _setMsgListRef (ref) {
        this._msgListRef = ref;
      },

      _onScrollPastExistingConversation (isViewing) {
        this.props.onScrollPastExistingConversation (isViewing);
      },

      _onLoadMore () {
        // @TODO: Trigger the callback passed from props
        // for loading more messages
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
