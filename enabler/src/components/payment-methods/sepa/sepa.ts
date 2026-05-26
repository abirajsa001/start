import {
  ComponentOptions,
  PaymentComponent,
  PaymentComponentBuilder,
  PaymentMethod
} from '../../../payment-enabler/payment-enabler';

import { BaseComponent } from "../../base";

import styles from '../../../style/style.module.scss';
import buttonStyles from "../../../style/button.module.scss";

import {
  PaymentOutcome,
  PaymentRequestSchemaDTO,
} from "../../../dtos/novalnet-payment.dto";

import { BaseOptions } from "../../../payment-enabler/novalnet-payment-enabler";

export class SepaBuilder
  implements PaymentComponentBuilder {

  public componentHasSubmit = true;

  constructor(
    private baseOptions: BaseOptions
  ) {}

  build(
    config: ComponentOptions
  ): PaymentComponent {

    return new Sepa(
      this.baseOptions,
      config
    );
  }
}

export class Sepa extends BaseComponent {

  private showPayButton: boolean;

  constructor(
    baseOptions: BaseOptions,
    componentOptions: ComponentOptions
  ) {

    super(
      PaymentMethod.sepa,
      baseOptions,
      componentOptions
    );

    this.showPayButton =
      componentOptions?.showPayButton ?? false;
  }

  mount(selector: string) {

    /**
     * Correct selector escaping
     */
    const safeSelector =
      '#' + CSS.escape(
        selector.substring(1)
      );

    const container =
      document.querySelector(
        safeSelector
      );

    if (!container) {

      console.error(
        'Container not found:',
        safeSelector
      );

      return;
    }

    /**
     * Render template
     */
    container.insertAdjacentHTML("beforeend",this._getTemplate());

    /**
     * Update storefront label
     */
    setTimeout(() => {

      const labels =
        document.querySelectorAll(
          'label'
        );

      labels.forEach((label) => {

        const text =
          label.textContent
            ?.trim()
            .toLowerCase();

        if (
          text?.includes('sepa')
        ) {

          label.textContent =
            'Direct Debit SEPA';
        }
      });

    }, 300);

    /**
     * Bind pay button
     */
    if (this.showPayButton) {

      const button =
        document.querySelector(
          "#sepa-payment-button"
        );

      if (button) {

        button.addEventListener(
          "click",
          (e) => {

            e.preventDefault();

            this.submit();
          }
        );
      }
    }
  }

  async submit() {

    this.sdk.init({
      environment:
        this.environment
    });

    const pathLocale =
      window.location.pathname
        .split("/")[1];

    const url =
      new URL(window.location.href);

    const baseSiteUrl =
      url.origin;

    try {

      const accountHolderInput =
        document.getElementById(
          'nn_account_holder'
        ) as HTMLInputElement;

      const ibanInput =
        document.getElementById(
          'nn_sepa_account_no'
        ) as HTMLInputElement;

      const bicInput =
        document.getElementById(
          'nn_sepa_bic'
        ) as HTMLInputElement;

      const accountHolder =
        accountHolderInput?.value
          ?.trim() ?? '';

      const iban =
        ibanInput?.value
          ?.trim() ?? '';

      const bic =
        bicInput?.value
          ?.trim() ?? '';

      const requestData:
        PaymentRequestSchemaDTO = {

        paymentMethod: {

          type:
            "DIRECT_DEBIT_SEPA",

          accHolder:
            accountHolder,

          iban:
            iban,

          bic:
            bic,
        },

        paymentOutcome:
          PaymentOutcome.AUTHORIZED,

        lang:
          pathLocale ?? 'de',

        path:
          baseSiteUrl,
      };

      const response =
        await fetch(
          this.processorUrl +
          "/directPayment",
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "X-Session-Id":
                this.sessionId,
            },

            body:
              JSON.stringify(
                requestData
              ),
          }
        );

      const data =
        await response.json();

      if (
        data.paymentReference
      ) {

        this.onComplete &&
          this.onComplete({

            isSuccess: true,

            paymentReference:
              data.paymentReference,
          });

      } else {

        this.onError(
          "Some error occurred. Please try again."
        );
      }

    } catch (e) {

      console.error(
        'SEPA Error:',
        e
      );

      this.onError(
        "Some error occurred. Please try again."
      );
    }
  }

  private _getTemplate() {

    const payButton =
      this.showPayButton
        ? `
          <button
            class="
              ${buttonStyles.button}
              ${buttonStyles.fullWidth}
              ${styles.submitButton}
            "

            id="sepa-payment-button"

            type="button"
          >
            Pay
          </button>
        `
        : "";

    return `

      <div
        style="
          width:100%;
          display:flex;
          flex-direction:column;
        "
      >

        <div
          id="nn_sepa_form"

          style="
            width:100%;
            display:flex;
            flex-direction:column;
            gap:20px;
          "
        >

          <div
            style="
              display:flex;
              flex-direction:column;
              width:100%;
            "
          >

            <label
              for="nn_account_holder"
            >
              Account Holder
              <span style="color:red;">
                *
              </span>
            </label>

            <input
              type="text"

              id="nn_account_holder"

              name="nn_account_holder"

              autocomplete="off"

              style="
                padding:12px;
                border:1px solid #d4d4d4;
                border-radius:6px;
              "
            />
          </div>

          <div
            style="
              display:flex;
              flex-direction:column;
              width:100%;
            "
          >

            <label
              for="nn_sepa_account_no"
            >
              IBAN
              <span style="color:red;">
                *
              </span>
            </label>

            <input
              type="text"

              id="nn_sepa_account_no"

              name="nn_sepa_account_no"

              autocomplete="off"

              style="
                padding:12px;
                border:1px solid #d4d4d4;
                border-radius:6px;
              "
            />
          </div>

          <div
            style="
              display:flex;
              flex-direction:column;
              width:100%;
            "
          >

            <label
              for="nn_sepa_bic"
            >
              BIC
            </label>

            <input
              type="text"

              id="nn_sepa_bic"

              name="nn_sepa_bic"

              autocomplete="off"

              style="
                padding:12px;
                border:1px solid #d4d4d4;
                border-radius:6px;
              "
            />
          </div>

          ${payButton}

        </div>

      </div>
    `;
  }
}