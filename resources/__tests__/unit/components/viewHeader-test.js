/**
 * Tests for components/commons/viewHeader
 * @author Riya Bagaria <riya@helpshift.com>
 * @created 15 April, 2020
 */

import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import ViewHeader from "components/commons/viewHeader";

/**
 * Setup enzyme wrapper for the View component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    title: "MOCK_VIEW_HEADER_TITLE",
    showBackBtn: true,
    showCloseBtn: true,
    onBackBtnClick: jest.fn(),
    onCloseBtnClick: jest.fn(),
    dataLabels: {
      backBtnDataLabel: "MOCK_DATA_LABEL_BACK_BTN"
    },
    ariaLabel: "MOCK_ARIA_LABEL",
    showAvatar: true,
    avatarUrl: "MOCK_AVATAR_URL"
  };

  return {
    props
  };
};

describe("ViewHeader", () => {
  it("should render correctly (snapshot)", () => {
    const {props} = setup();
    const tree = shallow(<ViewHeader {...props} />);

    expect(toJson(tree)).toMatchSnapshot();
  });
});
