import actionCreators from "../../../static/scripts/actions/actionCreators";
import ACTION_TYPES from "../../../static/scripts/constants/actionTypes";

describe("action creators", () => {
  it("should create an action to update the view", () => {
    const type = ACTION_TYPES.UPDATE_ACTIVE_VIEW;
    const view = "DUMMY_VIEW";

    const expectedAction = {
      type,
      view
    };
    expect(actionCreators.updateActiveView(view)).toEqual(expectedAction);
  });

  it("should create an action to toggle agent typing", () => {
    const type = ACTION_TYPES.TOGGLE_AGENT_TYPING;
    const agentIsTyping = false;

    const expectedAction = {
      type,
      typing: agentIsTyping
    };

    expect(actionCreators.toggleAgentTyping(agentIsTyping)).toEqual(expectedAction);
  });
});
