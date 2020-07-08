import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import CsatViewBody from "components/csatViewBody";

/**
 * Setup enzyme wrapper for the CsatViewBody component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    csatBotRequestMsg: "MOCK_REQUEST_MESSAGE",
    csatBotReviewPlaceholder: "MOCK_REVIEW_PLACEHOLDER",
    rating: 0,
    review: "MOCK_REVIEW",
    csatSaveInProgress: false,
    onCsatReviewChange: jest.fn(),
    onStarClick: jest.fn(),
    setAxActiveIndex: jest.fn(),
    onUpdateStarRating: jest.fn()
  };

  const enzymeWrapper = shallow(<CsatViewBody {...props} />);

  return {
    props,
    enzymeWrapper
  };
};

describe("CsatViewBody", () => {
  it("should render correctly (snapshot)", () => {
    const {props} = setup();
    const tree = shallow(<CsatViewBody {...props} />);

    expect(toJson(tree)).toMatchSnapshot();
  });

  it("should render its elements correctly", () => {
    const {enzymeWrapper} = setup();
    expect(enzymeWrapper.find("h3").text()).toBe("MOCK_REQUEST_MESSAGE");

    const starRatingProps = enzymeWrapper.find("StarRating").props();
    expect(starRatingProps.name).toBe("csat");
    expect(starRatingProps.editing).toBe(true);
    expect(starRatingProps.value).toBe(0);

    const textareaProps = enzymeWrapper.find("textarea").props();
    expect(textareaProps.value).toBe("MOCK_REVIEW");
    expect(textareaProps.dir).toBe("auto");
    expect(textareaProps.disabled).toBe(false);
    expect(textareaProps.className).toBe("hs-csat__input");

    expect(textareaProps.placeholder).toBe("MOCK_REVIEW_PLACEHOLDER");
  });
});
