
/* --- VUE CREDIT CARD LOGIC --- */
new Vue({
    el: "#card-mount-point",
    data() {
        return {
            currentCardBackground: Math.floor(Math.random() * 25 + 1),
            cardName: "",
            cardNumber: "",
            cardMonth: "",
            cardYear: "",
            cardCvv: "",
            minCardYear: new Date().getFullYear(),
            amexCardMask: "#### ###### #####",
            otherCardMask: "#### #### #### ####",
            cardNumberTemp: "",
            isCardFlipped: false,
            focusElementStyle: null,
            isInputFocused: false,
            // Rotation Logic
            rotatedCardType: 'visa',
            isRotating: false,
            rotationInterval: null,
            brandList: ['visa', 'mastercard', 'amex', 'discover', 'jcb', 'troy', 'dinersclub', 'unionpay']
        };
    },
    mounted() {
        this.cardNumberTemp = "";
        this.startRotation(); // Start rotation on load
    },
    computed: {
        getCardType() {
            let number = this.cardNumber;
            // If empty, return rotating type
            if (!number || number.length === 0) {
                return this.rotatedCardType;
            }

            let re = new RegExp("^4");
            if (number.match(re) != null) return "visa";

            re = new RegExp("^(34|37)");
            if (number.match(re) != null) return "amex";

            re = new RegExp("^5[1-5]");
            if (number.match(re) != null) return "mastercard";

            re = new RegExp("^6011");
            if (number.match(re) != null) return "discover";

            re = new RegExp('^9792')
            if (number.match(re) != null) return 'troy'

            return "visa"; // default fallback
        },
        generateCardNumberMask() {
            return this.getCardType === "amex" ? this.amexCardMask : this.otherCardMask;
        },
        minCardMonth() {
            if (this.cardYear === this.minCardYear) return new Date().getMonth() + 1;
            return 1;
        }
    },
    watch: {
        cardYear() {
            if (this.cardMonth < this.minCardMonth) {
                this.cardMonth = "";
            }
        },
        cardNumber(val) {
            if (val && val.length > 0) {
                this.stopRotation();
            } else {
                this.startRotation();
            }
        }
    },
    methods: {
        startRotation() {
            if (this.isRotating) return;
            this.isRotating = true;
            this.rotatedCardType = 'visa'; // Always start cleanly
            this.rotationInterval = setInterval(() => {
                const currentIndex = this.brandList.indexOf(this.rotatedCardType);
                const nextIndex = (currentIndex + 1) % this.brandList.length;
                this.rotatedCardType = this.brandList[nextIndex];
            }, 2000); // 2 seconds per card
        },
        stopRotation() {
            this.isRotating = false;
            if (this.rotationInterval) {
                clearInterval(this.rotationInterval);
                this.rotationInterval = null;
            }
        },
        flipCard(status) {
            this.isCardFlipped = status;
        },
        focusInput(e) {
            this.isInputFocused = true;
            let targetRef = e.target.dataset.ref;
            let target = this.$refs[targetRef];
            this.focusElementStyle = {
                width: `${target.offsetWidth}px`,
                height: `${target.offsetHeight}px`,
                transform: `translateX(${target.offsetLeft}px) translateY(${target.offsetTop}px)`
            }
        },
        blurInput() {
            let vm = this;
            setTimeout(() => {
                if (!vm.isInputFocused) {
                    vm.focusElementStyle = null;
                }
            }, 300);
            vm.isInputFocused = false;
        },
        submitPayment() {
            console.log("Vue Submit Triggered");
            if (typeof processMockPayment === 'function') {
                processMockPayment();
            } else {
                const btn = document.getElementById('completeOrderBtn');
                const event = new Event('triggerPayment');
                document.dispatchEvent(event);
            }
        },
        fitCardToScreen() {
            const card = this.$el.querySelector('.card-item');
            if (!card) return;

            // Reset for calculation
            card.style.transform = 'none';
            card.style.marginBottom = '0px';

            const containerWidth = this.$el.clientWidth;
            // 430 is the base width of the card
            const cardBaseWidth = 430;

            // If container is smaller than card (mobile)
            // We use a small buffer (e.g. 20px) so it doesn't touch edges
            if (containerWidth < cardBaseWidth + 20 && containerWidth > 0) {
                let scale = (containerWidth - 20) / cardBaseWidth;
                // Cap scale at 1
                if (scale > 1) scale = 1;

                card.style.position = 'relative'; // Ensure it flows
                card.style.transformOrigin = 'center top';
                card.style.transform = `scale(${scale})`;

                // Adjust margin bottom because scaling leaves whitespace
                // 270 is card height
                const heightLost = 270 * (1 - scale);
                card.style.marginBottom = `-${heightLost}px`;
            } else {
                // Reset if desktop/wide
                card.style.transform = 'none';
                card.style.marginBottom = '0';
            }
        }
    },
    mounted() {
        this.cardNumberTemp = "";
        this.startRotation();

        // Dynamic Scaling Login
        this.$nextTick(() => {
            this.fitCardToScreen();

            // 1. Window Resize Listener
            window.addEventListener('resize', this.fitCardToScreen);

            // 2. ResizeObserver (Detects when container becomes visible/changes size)
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.fitCardToScreen();
                });
                this.resizeObserver.observe(this.$el);
            }
        });
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.fitCardToScreen);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
});
