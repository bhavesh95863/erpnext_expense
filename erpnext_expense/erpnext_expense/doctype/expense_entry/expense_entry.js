// Copyright (c) 2024, Nesscale Solutions Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Expense Entry", {
    setup(frm) {
		frm.fields_dict["accounts"].grid.get_field("expense_account").get_query = function(doc, cdt, cdn) {
			var d = locals[cdt][cdn];
			return {
				filters: {
					"is_group": 0,
					"root_type": "Expense",
					'company': frm.doc.company
				}
			}
		}
    },
    refresh(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(
                __("Accounting Ledger"),
                () => {
                    frappe.route_options = {
                        voucher_no: frm.doc.name,
                        from_date: frm.doc.posting_date,
                        to_date: frm.doc.posting_date,
                        company: frm.doc.company,
                        group_by: "Group by Voucher (Consolidated)",
                        show_cancelled_entries: frm.doc.docstatus === 2,
                    };
                    frappe.set_route("query-report", "General Ledger");
                },
                __("View")
            );
        }
    },
	mode_of_payment(frm) {
		erpnext.accounts.pos.get_payment_mode_account(frm, frm.doc.mode_of_payment, function(account) {
			frm.set_value("mode_of_payment_account", account);
		})
	},
});

frappe.ui.form.on('Expense Entry Detail', {
	expense_type: function(frm, cdt, cdn) {
		var d = locals[cdt][cdn];
        if(d.expense_type) {
            if (!frm.doc.company) {
                d.expense_type = "";
                frappe.msgprint(__("Please set the Company"));
                frm.refresh_fields();
                return;
            }

            return frappe.call({
                method: "erpnext_expense.erpnext_expense.doctype.expense_entry.expense_entry.get_expense_type_account_and_cost_center",
                args: {
                    "expense_type": d.expense_type,
                    "company": frm.doc.company
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.model.set_value(cdt,cdn,"expense_account",r.message.account)
                        frappe.model.set_value(cdt,cdn,"cost_center",r.message.cost_center)
                    }
                }
            });
        }else{
            d.expense_account = "";
            d.cost_center = "";
            frm.refresh_fields();
            return

        }
	}
});
