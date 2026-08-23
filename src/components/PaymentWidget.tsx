import { QRCodeSVG } from "qrcode.react";

interface PaymentWidgetProps {
  amount: number;
}

export default function PaymentWidget({ amount }: PaymentWidgetProps) {
  // We URL-encode the name so spaces don't break the link
  const payeeName = encodeURIComponent("Mr PRATHMESH DILIP BORATE");
  const upiId = "8108670904@upi";
  
  // The official UPI deep link format
  const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR`;

  if (amount <= 0) return null;

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center">
      <h3 className="font-bold text-slate-900 mb-2">Complete Your Payment</h3>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Pay <span className="font-bold text-slate-900">₹{amount}</span> using your preferred UPI app.
      </p>

      {/* --- DESKTOP VIEW: Show QR Code --- */}
      <div className="hidden md:flex flex-col items-center">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <QRCodeSVG 
            value={upiLink} 
            size={200} 
            level="H" // High error correction
            includeMargin={true}
          />
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center max-w-xs">
          Open Google Pay, PhonePe, or Paytm and scan this code to pay.
        </p>
      </div>

      {/* --- MOBILE VIEW: Show Click-to-Pay Button --- */}
      <div className="md:hidden w-full flex flex-col items-center">
        <a 
          href={upiLink}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-center transition-all shadow-md flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Pay ₹{amount} via UPI App
        </a>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Tapping this will automatically open your default UPI app.
        </p>
      </div>
      
      {/* Manual UPI ID display for both views */}
      <div className="mt-6 pt-4 border-t border-gray-200 w-full text-center">
        <p className="text-xs text-gray-500 mb-1">Or transfer manually to:</p>
        <p className="font-mono font-bold text-slate-900 text-sm">{upiId}</p>
      </div>
    </div>
  );
}