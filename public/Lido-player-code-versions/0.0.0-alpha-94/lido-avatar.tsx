import { Component, Host, h, Prop, Element } from '@stencil/core';
import { Rive, RuntimeLoader } from '@rive-app/canvas';
import { RiveService } from '../../utils/rive-service';
import { convertUrlToRelative, initEventsForElement, setVisibilityWithDelay} from '../../utils/utils';

/**
 * @component LidoAvatar
 *
 * The `LidoAvatar` component is a customizable avatar that integrates with Rive animations.
 * It allows for configurable properties such as size, position, visibility, background color,
 * and event handlers. The component supports accessibility attributes and can trigger various
 * events based on user interactions.
 *
 * This component initializes and manages a Rive animation inside a canvas element.
 */

@Component({
  tag: 'lido-avatar',
  styleUrl: 'lido-avatar.css',
  shadow: false,
  assetsDirs: ['.'],
})
export class LidoAvatar {
  private static readonly RIVE_WASM_URL = 'https://unpkg.com/@rive-app/canvas@2.32.0/rive.wasm';

  /**
   * The unique identifier for the column component.
   */
  @Prop() id: string = '';

  /**
   * The value associated with the column component. Typically used for internal logic.
   */
  @Prop() value: string = '';

  /**
   * The height of the column component (CSS value, e.g., '100px', '50%').
   */
  @Prop() height: string = '';

  /**
   * The width of the column component (CSS value, e.g., '100px', '50%').
   */
  @Prop() width: string = 'auto';

  /**
   * The ARIA label of the container. Used for accessibility to indicate the purpose of the element.
   */
  @Prop() ariaLabel: string = '';

  /**
   * The ARIA hidden attribute of the container. Used for accessibility to hide the element.
   */
  @Prop() ariaHidden: string = '';

  /**
   * The x-coordinate (left position) of the column within its container (CSS value, e.g., '10px', '5vw').
   */
  @Prop() x: string = '0px';

  /**
   * The y-coordinate (top position) of the column within its container (CSS value, e.g., '10px', '5vh').
   */
  @Prop() y: string = '0px';

  /**
   * The z-index of the column to control stacking order.
   */
  @Prop() z: string = '0';

  /**
   * The background color of the column (CSS color value, e.g., '#FFFFFF', 'blue').
   */
  @Prop() bgColor: string = '';

  /**
   * Defines the type of the column, which can be used for styling or specific logic handling.
   */
  @Prop() type: string = '';

  /**
   * The tab index value, used to set the tab order of the column for keyboard navigation.
   */
  @Prop() tabIndex: number = 0;

  /**
   * A boolean that controls whether the column is visible (`true`) or hidden (`false`).
   */
  @Prop() visible: boolean = false;

  /**
   * Audio file URL or identifier for sound that will be associated with the column.
   */
  @Prop() audio: string = '';

  /**
   * Instance of the Rive animation
   */
  private riveInstance: any;

  /**
   * Source URL of the Rive (.riv) file
   */
  @Prop() src: string = '';

  /**
   * Event handler for a touch event, where a custom function can be triggered when the column is touched.
   */
  @Prop() onTouch: string = '';

  /**
   * Event handler for an Incorrect matching action, which can be used to trigger custom logic when the action is incorrect.
   */
  @Prop() onInCorrect: string = '';

  /**
   * Event handler for a Correct matching action, which can be used to hide the column or trigger other custom logic.
   */
  @Prop() onCorrect: string = '';


  /**
   * Event handler for when the column is entered, which can be used to initiate specific behaviors on entry.
   */
  @Prop() onEntry: string = '';

  /**
   * Reference to the HTML element that represents this component.
   */
  @Element() el: HTMLElement;

  /**
    * Delay in milliseconds to make the cell visible after mount.
    */
  @Prop() delayVisible: string = '';

  /**
   * This lifecycle hook is called after the component is rendered in the DOM.
   * It initializes events for the column based on the provided type.
   */
  async componentDidLoad() {
    RuntimeLoader.setWasmUrl(LidoAvatar.RIVE_WASM_URL);

    setVisibilityWithDelay(this.el, this.delayVisible);

    initEventsForElement(this.el, this.type);

    // const resolvedPath = this.src.startsWith('http')
    //   ? this.src // Use the provided URL if it's an HTTP/HTTPS link
    //   : getAssetPath(this.src); // Otherwise, resolve it as an asset path

    this.initializeRive(convertUrlToRelative(this.src));
  }

  /**
   * Initializes the Rive animation instance after the component is rendered.
   * It selects the canvas element, loads the Rive file, and starts the animation.
   * The animation surface is resized to fit the canvas, and the instance is stored in the service.
   */
  initializeRive = rivSrc => {
    const riveService = RiveService.getInstance();
    const canvas = this.el.querySelector('canvas');
    this.riveInstance = new Rive({
      src: rivSrc,
      canvas: canvas,
      stateMachines: 'Idle',
      autoplay: true,
      onLoad: () => {
        this.riveInstance.resizeDrawingSurfaceToCanvas();
        riveService.setRiveInstance(this.riveInstance);
      },
    });
  };

  render() {
    // Inline styles applied to the column, mainly for positioning and background.
    const style = {
      height: this.height,
      width: this.width,
      backgroundColor: this.bgColor,
      top: this.y,
      left: this.x,
      display: this.visible ? 'flex' : 'none',
      zIndex: this.z,
    };

    return (
      <Host
        id={this.id}
        type={this.type}
        tab-index={this.tabIndex}
        value={this.value}
        style={style}
        aria-label={this.ariaLabel}
        aria-hidden={this.ariaHidden}
        audio={this.audio}
        onTouch={this.onTouch}
        onCorrect={this.onCorrect}
        onInCorrect={this.onInCorrect}
        onEntry={this.onEntry}
        src={this.src}
      >
        <canvas class="lido-canvas"></canvas>
      </Host>
    );
  }
}
