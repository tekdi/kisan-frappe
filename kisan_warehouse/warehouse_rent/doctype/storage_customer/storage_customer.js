frappe.ui.form.on('Storage Customer', {
    refresh: function(frm) {
        // Set default values
        if (frm.is_new()) {
            frm.set_value('status', 'Active');
            frm.set_value('customer_type', 'Individual');
        }
    },

    validate: function(frm) {
        // Capitalize first, middle, last names
        ['first_name', 'middle_name', 'last_name', 'city', 'state'].forEach(function(field) {
            if (frm.doc[field]) {
                let formatted = frm.doc[field].charAt(0).toUpperCase() + frm.doc[field].slice(1).toLowerCase();
                if (formatted !== frm.doc[field]) {
                    frm.set_value(field, formatted);
                }
            }
        });


        // Mobile validation
        if (frm.doc.mobile) {
            let mobile = frm.doc.mobile.replace(/\D/g, '');
            if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
                frappe.msgprint({
                    title: __('Invalid Mobile Number'),
                    message: __('Mobile number must be 10 digits and start with 6, 7, 8, or 9'),
                    indicator: 'red'
                });
                frappe.validated = false;
                return;
            }
            frm.set_value('mobile', mobile);
        }

        // Alternate mobile validation
        if (frm.doc.alternate_mobile) {
            let alt_mobile = frm.doc.alternate_mobile.replace(/\D/g, '');
            if (frm.doc.mobile && alt_mobile === frm.doc.mobile) {
                frappe.msgprint({
                    title: __('Invalid Alternate Mobile'),
                    message: __('Alternate mobile must be different from primary mobile'),
                    indicator: 'red'
                });
                frappe.validated = false;
                return;
            }
            if (alt_mobile.length !== 10 || !/^[6-9]\d{9}$/.test(alt_mobile)) {
                frappe.msgprint({
                    title: __('Invalid Alternate Mobile'),
                    message: __('Alternate mobile number must be 10 digits and start with 6, 7, 8, or 9'),
                    indicator: 'red'
                });
                frappe.validated = false;
                return;
            }
            frm.set_value('alternate_mobile', alt_mobile);
        }

        // Email validation
        if (frm.doc.email) {
            let email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email_regex.test(frm.doc.email)) {
                frappe.msgprint({
                    title: __('Invalid Email'),
                    message: __('Please enter a valid email address'),
                    indicator: 'red'
                });
                frappe.validated = false;
                return;
            }
        }

        // ZIP validation
        if (frm.doc.zip) {
            let zip = frm.doc.zip.replace(/\D/g, '');
            if (zip.length !== 6) {
                frappe.msgprint({
                    title: __('Invalid ZIP Code'),
                    message: __('ZIP code must be exactly 6 digits'),
                    indicator: 'red'
                });
                frappe.validated = false;
                return;
            }
            frm.set_value('zip', zip);
        }
    }
});


