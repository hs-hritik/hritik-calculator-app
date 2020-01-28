/**
 * Components for rendering attachment messages and attachments
 * @author Prasenjit Sharan <ps@helpshift.com>
 * @created 12 Jan, 2019
 */

define("components/attachment", [
  "helpers/attachments",
  "gunpowder/utils/classes",
  "constants/errors"
], function(attachmentsHelpers, classes, ERROR_CONSTANTS) {
  "use strict";

  const {useState, useEffect, createRef} = React;
  const IMAGE_MSG_MAX_HEIGHT = 170;
  const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;

  /**
   * The default click handler for attachments. Opens the attachment URL in a new window.
   * @param {string} url
   */
  const _onAttachmentClick = (url) => {
    window.open(url);
  };

  /**
   * Get the aria label for an attachment based on the file name and the template string for opening
   * a file.
   * @param {string} fileName
   * @param {string} ariaLabelOpenFile
   * @returns {string} - the aria label for opening an attachment file
   */
  const _getAttachmentAriaLabel = (fileName, ariaLabelOpenFile) => {
    const formatedFileName = attachmentsHelpers.getFormattedFileName(fileName);
    return ariaLabelOpenFile.replace("{{file_name}}", formatedFileName);
  };

  /**
   * Previewable attachment component.
   * @param {Object} props
   * @param {string} props.url - URL of the attachment object.
   * @param {Object} props.file - The file object added to the message object in case of client
   *    generated message.
   * @param {string} props.wrapperClasses - Class names to be applied on the wrapper div of this
   *    component
   * @param {function} props.onWrapperClick - Click handler for the attachment message - can be one
   *    of the following - retry - in case of an error, open the file, and none - in case of
   *    non-retriable error.
   * @param {function} onImageLoad - Prop passed from "above" applicable in case of image
   *    attachments.
   * @returns {element} - Previewable attachment element.
   */
  const PreviewableAttachment = (props) => {
    const {url, file, wrapperClasses, onWrapperClick, onImageLoad} = props;
    const [imageHasLoaded, setImageHasLoaded] = useState(false);
    const [wrapperHeight, setWrapperHeight] = useState(IMAGE_MSG_MAX_HEIGHT);

    const _onImageLoad = (ev) => {
      const imageHeight = ev.target.clientHeight;

      if (imageHeight < IMAGE_MSG_MAX_HEIGHT) {
        setWrapperHeight(imageHeight);
      }

      if (onImageLoad) {
        onImageLoad();
      }

      setImageHasLoaded(true);
    };

    // Render uploaded image
    if (url) {
      return (
        <UploadedImage
          imageHasLoaded={imageHasLoaded}
          url={url}
          wrapperClasses={wrapperClasses}
          wrapperHeight={wrapperHeight}
          onClick={onWrapperClick}
          onImageLoad={_onImageLoad}
        />
      );
    }

    // Render local image
    return (
      <LocalImage
        imageHasLoaded={imageHasLoaded}
        file={file}
        wrapperClasses={wrapperClasses}
        wrapperHeight={wrapperHeight}
        onClick={onWrapperClick}
        onImageLoad={_onImageLoad}
      />
    );
  };

  PreviewableAttachment.propTypes = {
    url: PropTypes.string,
    file: PropTypes.object,
    wrapperClasses: PropTypes.string,
    onWrapperClick: PropTypes.func,
    onImageLoad: PropTypes.func
  };

  /**
   * Uploaded image component - An image attachment that has been uploaded on the backend.
   * @param {Object} props
   * @param {boolean} props.imageHasLoaded - Whether the image has been loaded on the client side.
   * @param {string} props.url - URL of the uploaded image.
   * @param {string} props.wrapperClasses - Class names to be applied on the wrapper div of this
   *    component
   * @param {number} props.wrapperHeight - Height of the attachment bubble wrapper.
   * @param {function} props.onClick
   * @param {function} props.onImageLoad
   * @returns {element} - Uploaded image element.
   */
  const UploadedImage = (props) => {
    const {imageHasLoaded, url, wrapperClasses, wrapperHeight, onClick, onImageLoad} = props;

    const wrapperStyles = {
      backgroundImage: `url(${url})`,
      height: `${wrapperHeight}px`
    };

    let imageEl = null;

    if (!imageHasLoaded) {
      imageEl = <img className="hs-message__height-finder" src={url} onLoad={onImageLoad} />;
    }

    return (
      <div style={wrapperStyles} className={wrapperClasses} onClick={onClick}>
        {imageEl}
      </div>
    );
  };

  UploadedImage.propTypes = {
    imageHasLoaded: PropTypes.bool,
    url: PropTypes.string.isRequired,
    wrapperClasses: PropTypes.string,
    wrapperHeight: PropTypes.number,
    onClick: PropTypes.func.isRequired,
    onImageLoad: PropTypes.func.isRequired
  };

  /**
   * Local image component - An image attachment that has not been uploaded on the backend yet.
   * @param {Object} props
   * @param {boolean} props.imageHasLoaded - Whether the image has been loaded on the client side.
   * @param {string} props.wrapperClasses - Class names to be applied on the wrapper div of this
   *    component
   * @param {number} props.wrapperHeight - Height of the attachment bubble wrapper.
   * @param {string} props.file - the file object selected by the user.
   * @param {function} props.onClick
   * @param {function} props.onImageLoad
   * @returns {element} - Uploaded image element.
   */
  const LocalImage = (props) => {
    const {imageHasLoaded, wrapperClasses, wrapperHeight, file, onClick, onImageLoad} = props;
    const [fileIsRead, setFileIsRead] = useState(false);
    const [localImageData, setLocalImageData] = useState(null);
    const _localImageWrapperRef = createRef();
    const _localImageRef = createRef();

    useEffect(() => {
      if (!_localImageWrapperRef || fileIsRead) {
        return;
      }

      setFileIsRead(true);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        // @TODO :- check if image ref has already set src
        setLocalImageData(ev.target.result);
      };
    }, [_localImageWrapperRef, fileIsRead, file]);

    const bgImg = localImageData ? `url(${localImageData})` : "none";
    let imageEl = null;

    if (!imageHasLoaded) {
      const imageProps = {
        ref: _localImageRef,
        className: "hs-message__height-finder"
      };

      if (localImageData) {
        imageProps.src = localImageData;
        imageProps.onLoad = onImageLoad;
      }

      imageEl = <img {...imageProps} />;
    }

    const wrapperStyles = {
      backgroundImage: bgImg,
      height: `${wrapperHeight}px`
    };

    const className = `${wrapperClasses} hs-message__failed-img`;

    return (
      <div onClick={onClick}>
        <div ref={_localImageWrapperRef} style={wrapperStyles} className={className}>
          {imageEl}
        </div>
      </div>
    );
  };

  LocalImage.propTypes = {
    imageHasLoaded: PropTypes.bool,
    wrapperClasses: PropTypes.string,
    wrapperHeight: PropTypes.number,
    file: PropTypes.object,
    onClick: PropTypes.func,
    onImageLoad: PropTypes.func
  };

  /**
   * Non previewable attachment component.
   * @param {Object} props
   * @param {string} props.name - Name of the attachment file.
   * @param {string} props.wrapperClasses - Class names to be applied on the wrapper div of this
   *    component
   * @param {string} props.iconClasses - Used for attachment and error state icons.
   * @param {string} props.attachmentAriaLabel
   * @param {function} props.onWrapperClick - Click handler for the attachment message - can be one
   *    of the following - retry - in case of an error, open the file, and none - in case of
   *    non-retriable error.
   * @param {element} - Non previewable attachment element.
   */
  const NonPreviewableAttachment = (props) => {
    const {name, wrapperClasses, iconClasses, attachmentAriaLabel, onWrapperClick} = props;

    return (
      <div
        className={wrapperClasses}
        onClick={onWrapperClick}
        aria-label={attachmentAriaLabel}
        role="button">
        <i className={iconClasses} />
        <span title={name}>{attachmentsHelpers.getFormattedFileName(name)}</span>
      </div>
    );
  };

  NonPreviewableAttachment.propTypes = {
    name: PropTypes.string,
    wrapperClasses: PropTypes.string,
    iconClasses: PropTypes.string,
    attachmentAriaLabel: PropTypes.string.isRequired,
    onWrapperClick: PropTypes.func
  };

  /**
   * User attachment message component.
   * @param {Object} props
   * @param {boolean} props.messageIsClientGenerated - The message object is generated as a dummy
   *    message on the client side.
   * @param {string} ariaLabelOpenFile - Voice over aria label for the attachment message.
   * @param {Object} props.messageStates - Message states used to check error and uploading states.
   * @param {Object} props.file - The file object added to the message object in case of client
   *    generated message.
   * @param {array} props.attachments - List of attachments in the message object. In case of user
   *    attachment, this list contains only one attachment item.
   * @param {function} props.onRetryClick - Only applicable for client generated message when the
   *    upload fails. Used as the click handler for the message bubble.
   * @param {function} props.onImageLoad - Only applicable for previewable attachment message.
   * @returns {element} - User attachment message element.
   */
  const UserAttachmentMessage = (props) => {
    const {
      messageIsClientGenerated,
      ariaLabelOpenFile,
      messageStates,
      file,
      attachments,
      onRetryClick,
      onImageLoad
    } = props;

    let name, url, iconClasses, onWrapperClick, contentType;

    // Attachment message is a frontend/dummy message
    if (messageIsClientGenerated) {
      name = file.name;

      // If attachment message is uploading, set loading icons
      if (messageStates.uploadInProgress) {
        iconClasses = classes("ion-load-b", "ion--spinning");
      } else if (messageStates.error) {
        // If attachment message has errors, set icon classes depending on
        // error code. Also attach retry click handler in case of failure is
        // retriable.
        const errorCode = messageStates.errorCode;
        const failureIsRetriable = errorCode === FILE_UPLOAD_ERRORS.RETRY;

        if (failureIsRetriable) {
          onWrapperClick = onRetryClick;
        } else {
          onWrapperClick = null;
        }

        iconClasses = classes("hs-message__icon-error", {
          "ion-alert-circled": !failureIsRetriable,
          "ion-reset": failureIsRetriable
        });
      } else {
        iconClasses = "";
      }
    } else {
      // Attachment message is a backend message
      const attachment = attachments[0];

      name = attachment.fileName;
      url = attachment.url;
      contentType = attachment.contentType;
      iconClasses = "ion-attachment";
      onWrapperClick = () => {
        _onAttachmentClick(url);
      };
    }

    const attachmentAriaLabel = _getAttachmentAriaLabel(name, ariaLabelOpenFile);

    // Determine if the attachment is previewable or not
    const isImageAttachment = attachmentsHelpers.isImageAttachment(contentType);
    const localAttachmentHasError = messageIsClientGenerated ? messageStates.error : true;

    // For any attachment to be previewable
    // a] The type of attachment must be of type image and
    // b] If it is local image, it should have error
    //    Do not show preview while uploading!
    const attachmentIsPreviewable = isImageAttachment && localAttachmentHasError;

    if (attachmentIsPreviewable) {
      return (
        <PreviewableAttachment
          url={url}
          file={file}
          wrapperClasses="hs-message__item hs-message__image-attachment"
          onImageLoad={onImageLoad}
          onWrapperClick={onWrapperClick}
        />
      );
    } else {
      return (
        <NonPreviewableAttachment
          url={url}
          name={name}
          iconClasses={iconClasses}
          wrapperClasses="hs-message__item hs-message__file-attachment"
          onWrapperClick={onWrapperClick}
          attachmentAriaLabel={attachmentAriaLabel}
        />
      );
    }
  };

  UserAttachmentMessage.propTypes = {
    messageIsClientGenerated: PropTypes.bool,
    ariaLabelOpenFile: PropTypes.string.isRequired,
    messageStates: PropTypes.object.isRequired,
    file: PropTypes.object,
    attachments: PropTypes.array,
    onRetryClick: PropTypes.func.isRequired,
    onImageLoad: PropTypes.func.isRequired
  };

  /**
   * Server attachment message component. It returns a list of "message items". An item can be a
   * text message, a previewable attachment (image) or a file attachment.
   * @param {Object} props
   * @param {string} ariaLabelOpenFile - Voice over aria label for the attachment message.
   * @param {array} props.attachments - List of attachments in the message object.
   * @returns {element} - User attachment message element.
   */
  const ServerAttachmentsMessage = (props) => {
    const {attachments, ariaLabelOpenFile} = props;

    if (!(attachments && attachments.length)) {
      return null;
    }

    return attachments.map((attachment, index) => {
      const {url, fileName, contentType} = attachment;
      const attachmentIsPreviewable = attachmentsHelpers.isImageAttachment(contentType);
      const onWrapperClick = () => {
        _onAttachmentClick(url);
      };
      const attachmentAriaLabel = _getAttachmentAriaLabel(fileName, ariaLabelOpenFile);

      if (attachmentIsPreviewable) {
        return (
          <PreviewableAttachment
            key={`previewable-${index}`}
            url={url}
            wrapperClasses="hs-message__item hs-message__image-attachment"
            onWrapperClick={onWrapperClick}
          />
        );
      }

      return (
        <NonPreviewableAttachment
          key={`nonpreviewable-${index}`}
          url={url}
          name={fileName}
          iconClasses="ion-attachment"
          wrapperClasses="hs-message__item hs-message__file-attachment"
          onWrapperClick={onWrapperClick}
          attachmentAriaLabel={attachmentAriaLabel}
        />
      );
    });
  };

  ServerAttachmentsMessage.propTypes = {
    ariaLabelOpenFile: PropTypes.string.isRequired,
    attachments: PropTypes.array
  };

  return {
    UserAttachmentMessage,
    ServerAttachmentsMessage
  };
});
