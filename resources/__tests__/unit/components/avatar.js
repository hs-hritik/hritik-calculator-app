/**
 * Tests for components/commons/avatar
 * @author Riya Bagaria <riya@helpshift.com>
 * @created 22 June, 2020
 */

import {shallow} from "enzyme";
import toJson from "enzyme-to-json";
import Avatar from "components/commons/avatar";

/**
 * Setup enzyme wrapper for the Avatar component
 * @return {object} - Object with the enzyme wrapper and props passed to the wrapper
 */
const setup = () => {
  const props = {
    fallbackAvatar: "MOCK_FALLBACK_AVATAR_URL",
    avatarUrl: "MOCK_AVATAR_URL",
    showAvatar: true
  };
  const enzymeWrapper = shallow(<Avatar {...props} />);

  return {
    props,
    enzymeWrapper
  };
};

describe("Avatar", () => {
  it("should render correctly (snapshot)", () => {
    const {props} = setup();
    const tree = shallow(<Avatar {...props} />);

    expect(toJson(tree)).toMatchSnapshot();
  });

  it("should render self and child elements", () => {
    const {enzymeWrapper} = setup();

    expect(enzymeWrapper.find(".hs-avatar__avatar")).toBeDefined();
  });
});
