
import React, { useEffect, useRef } from 'react';

interface WompiFormProps {
    amountInCents: string;
    reference: string;
    signature: string;
}

const WompiForm: React.FC<WompiFormProps> = ({ amountInCents, reference, signature }) => {
    const formContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (formContainerRef.current) {
            const form = document.createElement('form');
            const script = document.createElement('script');

            script.src = "https://checkout.wompi.co/widget.js";
            script.setAttribute("data-render", "button");
            script.setAttribute("data-public-key", "pub_prod_zZRXajwZWETiLAxxgAikt5yol64Zr3hw");
            script.setAttribute("data-currency", "COP");
            script.setAttribute("data-amount-in-cents", amountInCents);
            script.setAttribute("data-reference", reference);
            script.setAttribute("data-signature:integrity", signature);
            // Optional: Add a redirect URL for after the payment
            // script.setAttribute("data-redirect-url", "https://your-website.com/transaction/result");

            form.appendChild(script);

            // Clear the container and append the new form
            formContainerRef.current.innerHTML = '';
            formContainerRef.current.appendChild(form);
        }
    }, [amountInCents, reference, signature]); // Rerender if these change

    return <div ref={formContainerRef} />;
};

export default WompiForm;
