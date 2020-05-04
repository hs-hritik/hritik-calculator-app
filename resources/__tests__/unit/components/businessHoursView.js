/**
 * Tests for components/businessHoursView
 * @author Riya Bagaria <riya@helpshift.com>
 * @created 4 May, 2020
 */

import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import BusinessHoursView from "components/businessHoursView";

/**
 * Setup enzyme wrapper for the businessHoursView component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    onCloseBtnClick: jest.fn(),
    showCloseButton: false,
    allowFullScreen: true,
    text: {
      closeConversationBtn: "MOCK_CLOSE_CONVERSATION_BUTTON",
      businessHoursSubmitBtn: "MOCK_OOBH_SUBMIT_BUTTON",
      businessHoursViewHeader: "MOCK_OOBH_VIEW_HEADER",
      businessHoursContactFormMessage: "MOCK_OOBH_CONTACT_FORM_MSG",
      businessHoursOfflineMessage: "MOCK_OOBH_OFFLINE_MSG",
      businessHoursThankYouMessage: "MOCK_OOBH_THANKYOU_MSG",
      businessHoursAttachmentsLimitExceedMsg: "MOCK_LIMIT_EXCEED_MSG",
      businessHoursAttachmentsSizeExceedMsg: "MOCK_SIZE_EXCEED_MSG",
      attachmentFileTypeError: "MOCK_FILE_TYPE_ERROR",
      attachmentDefaultError: "MOCK_DEFAULT_ERROR",
      dndInfoText: "MOCK_DND_INFO_TEXT",
      ariaLabelsRemoveAttachment: "MOCk_ARIA_LABEL_REMOVE_ATTACHMENT",
      ariaLabelAddedAttachmentPrefix: "MOCk_ARIA_LABEL_ADDED_ATTACHMENT",
      ariaLabelAttachFiles: "MOCK_ARIA_LABEL_ATTACH_FILES"
    },
    contactFormDetails: {
      name: {
        enabled: true,
        value: {
          name: "MOCK_NAME",
          value: "MOCK_NAME"
        }
      },
      email: {
        name: {
          enabled: true,
          value: {
            name: "MOCK_EMAIL",
            value: "MOCK_EMAIL"
          }
        }
      },
      message: {
        name: {
          enabled: true,
          value: {
            name: "MOCK_MESSAGE",
            value: "MOCK_MESSAGE"
          }
        }
      },
      attachments: [],
      attachmentsMeta: {
        featureIsEnabled: true,
        limitHasExceeded: true,
        sizeHasExceeded: true,
        attachmentsAreInvalid: true
      }
    },
    onMinimizeConversation: jest.fn(),
    onChangeBusinessHoursContactFormDetails: jest.fn(),
    onSubmitBusinessHoursContactForm: jest.fn(),
    onFilesChange: jest.fn(),
    onRemoveAttachment: jest.fn(),
    contactFormSubmitted: true,
    contactFormDisabled: true,
    submitInProgress: true,
    fullPrivacyEnabled: true,
    keyboardInteractionIsActive: true,
    attachmentsWhitelist: [],
    showHeaderAvatar: true,
    appAvatarUrl: "MOCK_AVATAR_URL"
  };
  const enzymeWrapper = shallow(<BusinessHoursView {...props} />);

  return {
    props,
    enzymeWrapper
  };
};

// @TODO: Avatars - Add checks for more UI elements
describe("BusinessHoursView", () => {
  it("should render correctly (snapshot)", () => {
    const {props} = setup();
    const tree = shallow(<BusinessHoursView {...props} />);

    expect(toJson(tree)).toMatchSnapshot();
  });

  it("should render self and subcomponents", () => {
    const {enzymeWrapper} = setup();

    // Test the wrapper div
    expect(enzymeWrapper.first("div").hasClass("hs-view")).toBe(true);

    // Test ViewHeader child component
    const viewHeaderProps = enzymeWrapper.find("ViewHeader").props();
    expect(viewHeaderProps.title).toBe("MOCK_OOBH_VIEW_HEADER");
    expect(viewHeaderProps.showCloseBtn).toBe(false);
    expect(viewHeaderProps.showAvatar).toBe(true);
  });
});
