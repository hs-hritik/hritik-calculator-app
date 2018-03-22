/**
 * Entity related actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 7, 2017
 */
// @TODO - NORMALIZATION_CLEAN_UP
define ("actions/entities",
  ["constants/actionTypes"],
  function (ACTION_TYPES) {
    "use strict";

    const setEntities = (entities) => {
      return {
        type: ACTION_TYPES.SET_ENTITIES,
        entities
      };
    };

    return {
      setEntities
    };
  });
