/**
 * Tests for components/chatView
 * @author Riya Bagaria <riya@helpshift.com>
 * @created 4 May, 2020
 */

import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import ChatView from "components/chatView";

/**
 * Setup enzyme wrapper for the chatView component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    showCloseButton: true,
    error: {
      title: "MOCK_ERROR_TITLE"
    },
    keyboardInteractionIsActive: true,
    messages: [],
    onSuggestedFaqClick: jest.fn(),
    showAgentNickname: true,
    isTyping: true,
    onFilesDrop: jest.fn(),
    onRetryAttachmentClick: jest.fn(),
    userInput: {
      type: "MOCK_TYPE",
      options: []
    },
    issueIsCreated: true,
    onPillOptionSelect: jest.fn(),
    text: {
      chatViewHeader: "MOCK_CHAT_VIEW_HEADER",
      dndInfoText: "MOCK_DND_INFO_TEXT",
      pastConversationsLoadingText: "MOCK_PAST_CONVERSATIONS_LOADING_TEXT"
    },
    showHeaderAvatar: true,
    appAvatarUrl: "MOCK_AVATAR_URL",
    personalisedConversationIsEnabled: true,
    avatar: {
      showMessageFeedAvatar: true,
      agentAvatarIsPersonalised: true,
      botAvatarIsPersonalised: true,
      agentDefaultAvatarUrl: "MOCK_AGENT_DEFAULT_AVATAR_URL",
      botDefaultAvatarUrl: "MOCK_BOT_DEFAULT_AVATAR_URL",
      avatarUrlTemplate: "MOCK_AVATAR_URL_TEMPLATE"
    },
    avatarLastUpdatedTs: {}
  };
  const enzymeWrapper = shallow(<ChatView {...props} />);

  return {
    props,
    enzymeWrapper
  };
};

// @TODO: Avatars - Tests are incomplete. Add tests for more UI elements.
describe("ChatView", () => {
  it("should render correctly (snapshot)", () => {
    const {props} = setup();
    const tree = shallow(<ChatView {...props} />);

    expect(toJson(tree)).toMatchSnapshot();
  });

  it("should render self and subcomponents", () => {
    const {enzymeWrapper} = setup();

    // Test the wrapper div
    expect(enzymeWrapper.first("div").hasClass("hs-view")).toBe(true);

    // Test ViewHeader child component
    const viewHeaderProps = enzymeWrapper.find("ViewHeader").props();
    expect(viewHeaderProps.title).toBe("MOCK_CHAT_VIEW_HEADER");
    expect(viewHeaderProps.showCloseBtn).toBe(true);
    expect(viewHeaderProps.showAvatar).toBe(true);
  });
});
