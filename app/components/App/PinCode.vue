<template>
  <div class="vue-pincode-input-wrapper">
    <input
      v-for="(_, index) in inputs"
      :key="index"
      :ref="`${baseRefName}${index}`"
      v-model.trim="inputs[index]"
      :type="secure ? 'password' : 'tel'"
      :placeholder="placeholder"
      maxlength="1"
      :disabled="isDisabled"
      autocomplete="new-password-no-autofill"
      @paste="handlePaste($event, index)"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      class="vue-pincode-input"
      :class="[inputClasses, spacingClass]"
      @focus="focusedInputIndex = index"
      @keydown.delete="hadleDelete(index, $event)"
      @keydown="hadleKeyDown($event, index)"
    />
  </div>
</template>

<script>
export default {
  name: "PincodeInput",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    digits: {
      type: Number,
      default: 4,
    },
    placeholder: {
      type: String,
      default: "",
    },
    secure: {
      type: Boolean,
      default: false,
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
    inputClass: {
      type: String,
      default: "",
    },
    errorClass: {
      type: String,
      default: "error",
    },
    spacingClass: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    hasError: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      baseRefName: "vue-pincode-input",
      focusedInputIndex: 0,
      isPasting: false,
      watchers: {},
      inputs: this.initialInputs(),
    };
  },
  watch: {
    autofocus() {
      this.$nextTick(() => {
        this.applyAutofocus();
      });
    },
    disabled(isDisabled) {
      if (isDisabled) {
        this.blurFocusedInput();
        return;
      }
      this.$nextTick(() => {
        this.applyAutofocus();
      });
    },
  },
  computed: {
    inputClasses() {
      return [
        this.inputClass,
        !this.isValid ? this.errorClass : "default",
      ].join(" ");
    },
    isDisabled() {
      return this.disabled;
    },
    isValid() {
      // return this.inputs.join("").length === this.digits;
      return !this.hasError;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
      this.applyAutofocus();
    });
  },
  beforeUnmount() {
    this.unwatchInputs();
  },
  methods: {
    applyAutofocus() {
      if (!this.autofocus || this.isDisabled) {
        this.blurFocusedInput();
        return;
      }
      const firstInputRef = this.$refs[`${this.baseRefName}0`];
      if (firstInputRef && firstInputRef[0]) {
        firstInputRef[0].focus();
      }
    },
    blurFocusedInput() {
      if (typeof document === "undefined") return;
      const activeElement = document.activeElement;
      if (
        activeElement &&
        this.$el &&
        this.$el.contains(activeElement) &&
        activeElement.classList &&
        activeElement.classList.contains("vue-pincode-input")
      ) {
        activeElement.blur();
      }
    },
    init() {
      this.inputs = this.initialInputs();
      for (let index in this.inputs) {
        this.setInputWatcher(index);
      }
    },
    focusPreviousInput() {
      if (!this.focusedInputIndex) return;
      this.focusInputByIndex(this.focusedInputIndex - 1);
    },
    focusNextInput() {
      if (this.focusedInputIndex === this.digits - 1) return;
      this.focusInputByIndex(this.focusedInputIndex + 1);
    },
    focusInputByIndex(index) {
      const ref = `${this.baseRefName}${index}`;
      const el = this.$refs[ref];
      if (el) {
        el[0].focus();
        el[0].select();
      }
      this.focusedInputIndex = index;
    },
    hadleKeyDown(e, index) {
      this.focusedInputIndex = index;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.keyCode) {
        // left arrow key
        case 37:
          return this.focusPreviousInput();
        // right arrow key
        case 39:
          return this.focusNextInput();
        // tab, shift, escape, enter
        case 9:
        case 16:
        case 27:
        case 13:
          return;
        default:
          break;
      }
      const currVal = this.inputs[this.focusedInputIndex];
      if (currVal) return (this.inputs[this.focusedInputIndex] = "");
    },
    setInputWatcher(index) {
      const watchingProperty = `inputs.${index}`;
      this.watchers[watchingProperty] = this.$watch(
        watchingProperty,
        (newVal, oldVal) => this.hadleInputChange(index, newVal, oldVal)
      );
    },
    isInputValid(str, allowEmpty = true) {
      if (!str) {
        return allowEmpty ? str === "" : false;
      }
      return !!str.match("^\\d{1}$");
    },
    hadleInputChange(index, newVal, oldVal) {
      if (this.isPasting) return;
      this.$emit("update:modelValue", this.inputs.join(""));
      this.$emit("typeCode", this.inputs.join(""));
      if (!this.isInputValid(newVal, false)) {
        this.inputs[index] = "";
        return;
      }
      // Check all input filled
      if (+index === this.digits - 1) {
        const inputNotFillIndex = this.inputs.findIndex((v) => !v);
        inputNotFillIndex !== -1 && this.focusInputByIndex(inputNotFillIndex);
        return;
      }
      this.focusNextInput();
    },
    handleFocus(ref) {
      this.$refs[ref][0].setSelectionRange(1, 1);
    },
    pinfocus(ref) {
      this.$refs[ref][0].focus();
    },
    hadleDelete(index, e) {
      const isThisCellFilled = this.inputs[index].length;
      if (!isThisCellFilled) {
        this.focusPreviousInput();
        e.preventDefault();
      }
    },
    handlePaste(e, index) {
      if (this.isDisabled) return;
      const pastedText = e.clipboardData?.getData("text") || "";
      const pastedDigits = pastedText.replace(/\D/g, "");
      if (!pastedDigits) return;

      e.preventDefault();
      const maxLength = this.digits - index;
      const nextDigits = pastedDigits.slice(0, maxLength).split("");
      const nextInputs = [...this.inputs];

      nextDigits.forEach((value, offset) => {
        nextInputs[index + offset] = value;
      });
      for (let i = index + nextDigits.length; i < this.digits; i++) {
        nextInputs[i] = "";
      }

      this.isPasting = true;
      this.inputs = nextInputs;
      this.$emit("update:modelValue", this.inputs.join(""));
      this.$emit("typeCode", this.inputs.join(""));

      const firstEmptyIndex = this.inputs.findIndex((value) => !value);
      const focusIndex =
        firstEmptyIndex === -1
          ? this.digits - 1
          : Math.max(firstEmptyIndex, index);

      this.$nextTick(() => {
        this.focusInputByIndex(focusIndex);
        this.isPasting = false;
      });
    },
    initialInputs() {
      return this.modelValue
        ? this.modelValue.length <= this.digits
          ? [
              ...this.modelValue,
              ...[...Array(this.digits - this.modelValue.length)].map(() => ""),
            ]
          : [...this.modelValue.slice(0, this.digits)]
        : [...Array(this.digits)].map(() => "");
    },
    reset() {
      this.unwatchInputs();
      this.init();
    },
    unwatchInputs() {
      const watchers = Object.keys(this.watchers);
      watchers.forEach((name) => this.watchers[name]());
    },
  },
};
</script>

<style>
@reference "~/assets/css/main.css";
.vue-pincode-input-wrapper {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  row-gap: 1rem;
}

.vue-pincode-input-wrapper .vue-pincode-input {
  text-align: center;
  vertical-align: middle;
  @apply text-[1.2rem] border;
}

.vue-pincode-input-wrapper .vue-pincode-input.default {
  @apply border-[#DDE3EE] rounded-[12px] hover:border-brand-color-default hover:ring-2 hover:ring-brand-color-013 focus:border-brand-color-default focus:ring-4 focus:ring-brand-color-013;
  transition: all 0.3s;
}

.vue-pincode-input-wrapper .vue-pincode-input.default:not(:placeholder-shown) {
  @apply border-brand-color-default ring-4 ring-brand-color-013;
  transition: all 0.3s;
}

.vue-pincode-input-wrapper .vue-pincode-input.error {
  @apply border-red-600 hover:border-red-600 hover:ring-4 hover:ring-red-100 focus:border-red-600 focus:ring-4 focus:ring-red-100;
  transition: all 0.3s;
}

.vue-pincode-input-wrapper .vue-pincode-input.error:not(:placeholder-shown) {
  @apply border-red-600 ring-4 ring-red-100;
  transition: all 0.3s;
}

.vue-pincode-input-wrapper .vue-pincode-input:focus {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.vue-pincode-input-wrapper .vue-pincode-input:not(:last-child) {
  margin-right: 0.5rem;
}

.vue-pincode-input-wrapper .vue-pincode-input:focus {
  outline-style: none;
}
</style>
