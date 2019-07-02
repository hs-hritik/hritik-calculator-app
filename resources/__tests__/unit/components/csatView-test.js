/**
 * Tests for components/csatView
 * @author Prasenjt Sharan <prasenjit@helpshift.com>
 * @created 20 June, 2019
 */

import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import CsatView from "../../../static/scripts/components/csatView";

/**
 * Setup enzyme wrapper for the CsatView component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    rating: 0,
    review: "MOCK_REVIEW",
    showCloseButton: false,
    allowFullScreen: false,
    onMinimizeConversation: jest.fn (),
    onSubmitCsat: jest.fn (),
    onUpdateCsatRating: jest.fn (),
    onUpdateCsatReview: jest.fn (),
    text: {
      csatViewHeader: "MOCK_VIEW_HEADER",
      csatBotRequestMsg: "MOCK_REQUEST_MESSAGE",
      csatBotResponseMsg: "MOCK_RESPONSE_MESSAGE",
      csatBotFormSubmitBtn: "MOCK_FORM_SUBMIT_BUTTON",
      csatBotReviewPlaceholder: "MOCK_REVIEW_PLACEHOLDER",
      csatBotReviewTitle: "MOCK_REVIEW_TITLE"
    },
    viewStyles: {
      fontFamily: "MOCK_FONT_FAMILY"
    },
    csatSaveInProgress: false
  };

  const enzymeWrapper = shallow (<CsatView {...props} />);

  return {
    props,
    enzymeWrapper
  };
};

describe ("CsatView", () => {
  it ("should render correctly (snapshot)", () => {
    const {props} = setup ();
    const tree = shallow (<CsatView {...props} />);

    expect (toJson (tree)).toMatchSnapshot ();
  });

  it ("should render self and subcomponents", () => {
    const {enzymeWrapper} = setup ();

    // Test the wrapper div
    expect (enzymeWrapper.first ("div").hasClass ("hs-view")).toBe (true);

    // Test ViewHeader child component
    const viewHeaderProps = enzymeWrapper.find ("ViewHeader").props ();
    expect (viewHeaderProps.title).toBe ("MOCK_VIEW_HEADER");
    expect (viewHeaderProps.showCloseBtn).toBe (false);

    // Test CSAT body
    expect (enzymeWrapper.find ("h3").text ()).toBe ("MOCK_REQUEST_MESSAGE");

    const starRatingProps = enzymeWrapper.find ("StarRating").props ();
    expect (starRatingProps.name).toBe ("csat");
    expect (starRatingProps.editing).toBe (true);
    expect (starRatingProps.value).toBe (0);

    expect (enzymeWrapper.find (".hs-csat__form-label").text ())
      .toBe ("MOCK_REVIEW_TITLE");

    const textareaProps = enzymeWrapper.find ("textarea").props ();
    expect (textareaProps.value).toBe ("MOCK_REVIEW");
    expect (textareaProps.dir).toBe ("auto");
    expect (textareaProps.disabled).toBe (false);
    expect (textareaProps.className).toBe ("hs-csat__input");
    expect (textareaProps.placeholder).toBe ("MOCK_REVIEW_PLACEHOLDER");

    // Test CSAT footer
    const button = enzymeWrapper.find ("button");
    expect (button.text ()).toBe ("MOCK_FORM_SUBMIT_BUTTON");
  });

  it ("should call event handlers", () => {
    const {props, enzymeWrapper} = setup ();

    // Test onSubmitCsat
    const submitButton = enzymeWrapper.find ("button");
    submitButton.simulate ("click");
    expect (props.onSubmitCsat.mock.calls.length).toEqual (1);
  });
});
