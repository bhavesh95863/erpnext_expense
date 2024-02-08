// Copyright (c) 2024, Nesscale Solutions Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Expense Type", {
	refresh(frm) {
		frm.fields_dict["expense_type_account"].grid.get_field("default_account").get_query = function(doc, cdt, cdn) {
			var d = locals[cdt][cdn];
			return {
				filters: {
					"is_group": 0,
					"root_type": "Expense",
					'company': d.company
				}
			}
		}
	},
});
