frappe.listview_settings['Outward Jawak'] = {
    onload: function (listview) {
        // ============ GATEPASS BUTTON ============
        listview.page.add_action_item(__('Generate Gatepass'), function () {
            const selected = listview.get_checked_items();

            if (selected.length === 0) {
                frappe.msgprint({
                    title: __('No Records Selected'),
                    message: __('Please select at least one Outward Jawak record to generate the Gatepass.'),
                    indicator: 'red'
                });
                return;
            }

            const doc_ids = selected.map(item => item.name);

            frappe.show_alert({
                message: __('Generating Gatepass for {0} record(s)...', [selected.length]),
                indicator: 'blue'
            }, 3);

            if (doc_ids.length === 1) {
                const print_format = 'Gate Pass';
                const url = `/printview?doctype=Outward%20Jawak&name=${encodeURIComponent(doc_ids[0])}&format=${encodeURIComponent(print_format)}&_lang=en`;
                window.open(url, '_blank');
                return;
            }

            frappe.call({
                method: 'kisan_warehouse.warehouse_rent.doctype.outward_jawak.multi_gatepass.generate_multi_gatepass',
                args: {
                    doc_ids: doc_ids.join(',')
                },
                callback: function (r) {
                    if (r.message && r.message.success) {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(r.message.html);
                        printWindow.document.close();

                        frappe.show_alert({
                            message: __('Gatepass generated for {0} records', [r.message.count]),
                            indicator: 'green'
                        }, 3);
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            message: r.message.error || __('Failed to generate Gatepass'),
                            indicator: 'red'
                        });
                    }
                },
                error: function (err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to generate Gatepass. Please try again.'),
                        indicator: 'red'
                    });
                }
            });
        });

        // ============ PURCHASE RECEIPT BUTTON ============
        listview.page.add_action_item(__('Generate Purchase Receipt'), function () {
            const selected = listview.get_checked_items();

            if (selected.length === 0) {
                frappe.msgprint({
                    title: __('No Records Selected'),
                    message: __('Please select at least one Outward Jawak record to generate the Purchase Receipt.'),
                    indicator: 'red'
                });
                return;
            }

            const doc_ids = selected.map(item => item.name);

            frappe.show_alert({
                message: __('Generating Purchase Receipt for {0} record(s)...', [selected.length]),
                indicator: 'blue'
            }, 3);

            if (doc_ids.length === 1) {
                const print_format = 'Purchase Receipt';
                const url = `/printview?doctype=Outward%20Jawak&name=${encodeURIComponent(doc_ids[0])}&format=${encodeURIComponent(print_format)}&_lang=en`;
                window.open(url, '_blank');
                return;
            }

            frappe.call({
                method: 'kisan_warehouse.warehouse_rent.doctype.outward_jawak.multi_purchase_receipt.generate_multi_purchase_receipt',
                args: {
                    doc_ids: doc_ids.join(',')
                },
                callback: function (r) {
                    if (r.message && r.message.success) {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(r.message.html);
                        printWindow.document.close();

                        frappe.show_alert({
                            message: __('Purchase Receipt generated for {0} records', [r.message.count]),
                            indicator: 'green'
                        }, 3);
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            message: r.message.error || __('Failed to generate Purchase Receipt'),
                            indicator: 'red'
                        });
                    }
                },
                error: function (err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to generate Purchase Receipt. Please try again.'),
                        indicator: 'red'
                    });
                }
            });
        });
    }
};
