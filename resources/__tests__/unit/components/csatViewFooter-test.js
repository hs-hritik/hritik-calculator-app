import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import CsatViewFooter from "../../../static/scripts/components/csatViewFooter";

/**
 * Setup enzyme wrapper for the CsatViewBody component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    rating: 0,
    csatSaveInProgress: false,
    allowFullScreen: false,
    submitBtnText: "MOCK_FORM_SUBMIT_BUTTON",
    onSubmitCsat: jest.fn(),
    setAxActiveIndex: jest.fn()
  };

  const enzymeWrapper = shallow(<CsatViewFooter {...props} />);

  return {
    props,
    enzymeWrapper
  };
};

describe("CsatView", () => {
  it("should render correctly (snapshot)", () => {
    const {props} = setup();
    const tree = shallow(<CsatViewFooter {...props} />);

    expect(toJson(tree)).toMatchSnapshot();
  });

  it("should render its elements correctly", () => {
    const {enzymeWrapper} = setup();
    const button = enzymeWrapper.find("button");
    expect(button.text()).toBe("MOCK_FORM_SUBMIT_BUTTON");
  });

  it("should call event handlers", () => {
    const {props, enzymeWrapper} = setup();

    // Test onSubmitCsat
    const submitButton = enzymeWrapper.find("button");
    submitButton.simulate("click");
    expect(props.onSubmitCsat.mock.calls.length).toEqual(1);
  });
});
