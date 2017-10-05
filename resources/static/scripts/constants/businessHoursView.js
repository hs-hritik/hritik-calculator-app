/**
 * Business Hours View related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 4, 2017
 */

define ("constants/businessHoursView",
  function () {
    "use strict";

    const CONTACT_FORM_FIELDS = {
      NAME: "name",
      EMAIL: "email",
      MESSAGE: "message"
    };

    const OFFLINE_BEHAVIOUR = {
      CONTACT_FORM: "contact_form",
      OFFLINE_MESSAGE: "offline_message"
    };

    return {
      CONTACT_FORM_FIELDS,
      OFFLINE_BEHAVIOUR
    };
  }
);
