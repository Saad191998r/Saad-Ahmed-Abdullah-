import React from 'react';
import { HelpCircle, MessageCircle, Mail, FileText, Phone } from 'lucide-react';

export const Support: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">المساعدة والدعم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">المحادثة المباشرة</h3>
          <p className="text-sm text-gray-500 mb-4">تحدث مع فريق الدعم الفني مباشرة</p>
          <button className="text-indigo-600 font-medium hover:text-indigo-700">ابدأ المحادثة</button>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">البريد الإلكتروني</h3>
          <p className="text-sm text-gray-500 mb-4">أرسل لنا استفسارك وسنرد في أقرب وقت</p>
          <button className="text-indigo-600 font-medium hover:text-indigo-700">support@dukkan.iq</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            الأسئلة الشائعة
          </h2>
          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg">
              <summary className="flex items-center justify-between p-4 font-medium cursor-pointer text-gray-900">
                كيف يمكنني تتبع طلبي؟
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 px-4 pb-4">
                يمكنك تتبع طلبك من خلال الذهاب إلى صفحة "حسابي" ثم قسم "طلباتي"، واختيار الطلب الذي تريد تتبعه لمعرفة حالته الحالية.
              </p>
            </details>
            <details className="group border border-gray-200 rounded-lg">
              <summary className="flex items-center justify-between p-4 font-medium cursor-pointer text-gray-900">
                ما هي طرق الدفع المتاحة؟
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 px-4 pb-4">
                نقبل الدفع عبر زين كاش، آسيا حوالة، البطاقات الائتمانية، والدفع عند الاستلام في جميع محافظات العراق.
              </p>
            </details>
            <details className="group border border-gray-200 rounded-lg">
              <summary className="flex items-center justify-between p-4 font-medium cursor-pointer text-gray-900">
                كيف يمكنني إرجاع منتج؟
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-gray-600 px-4 pb-4">
                يمكنك طلب إرجاع المنتج خلال 14 يوماً من تاريخ الاستلام بشرط أن يكون في حالته الأصلية. تواصل مع الدعم الفني لترتيب عملية الإرجاع.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
