Third-party files used to make the order PDF on the checkout page
==================================================================
They are loaded only when a customer prepares an order PDF, and they run
entirely in the browser (nothing is uploaded).

jspdf.umd.min.js ................ jsPDF 4.2.1 (MIT licence)
jspdf.plugin.autotable.min.js ... jsPDF-AutoTable 5.0.8 (MIT licence)
order-pdf-assets.js ............. fonts + logo for the PDF (generated):
                                  Noto Sans Regular/Bold and Playfair Display Bold,
                                  subset to Latin + ₹, SIL Open Font License 1.1
                                  (see assets/fonts/OFL.txt)

To update jsPDF later: replace the two .min.js files with newer copies from
https://www.npmjs.com/package/jspdf (dist/jspdf.umd.min.js) and
https://www.npmjs.com/package/jspdf-autotable (dist/jspdf.plugin.autotable.min.js),
then change the ?v= numbers at the top of js/order-pdf.js.

------------------------------------------------------------------
jsPDF licence
------------------------------------------------------------------
Copyright
(c) 2010-2025 James Hall, https://github.com/MrRio/jsPDF
(c) 2015-2025 yWorks GmbH, https://www.yworks.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

------------------------------------------------------------------
jsPDF-AutoTable licence
------------------------------------------------------------------
The MIT License (MIT)

Copyright (c) 2014 Simon Bengtsson, https://github.com/simonbengtsson/jspdf-autotable

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
