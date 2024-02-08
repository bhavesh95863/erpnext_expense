# Copyright (c) 2024, Nesscale Solutions Pvt Ltd and contributors
# For license information, please see license.txt

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_link_to_form

import erpnext
from erpnext.accounts.general_ledger import make_gl_entries, make_reverse_gl_entries
from erpnext.controllers.accounts_controller import AccountsController

class ExpenseEntry(Document):
	get_gl_dict = AccountsController.get_gl_dict
	get_value_in_transaction_currency = (
        AccountsController.get_value_in_transaction_currency
    )
	get_voucher_subtype = AccountsController.get_voucher_subtype


	def validate(self):
		self.calculate_totals()
	
	def calculate_totals(self):
		self.total_expense = 0
		for account in self.accounts:
			self.total_expense += account.amount
	
	def on_submit(self):
		gl_entries = self.get_gl_entries()
		make_gl_entries(gl_entries)

	def on_cancel(self):
		self.ignore_linked_doctypes = ("GL Entry",)
		make_reverse_gl_entries(voucher_type=self.doctype, voucher_no=self.name)

	def get_gl_entries(self):
		# company_currency is required by get_gl_dict
		self.company_currency = erpnext.get_company_currency(self.company)

		gl_entries = []

		for account in self.accounts:
			gl_entries.append(
				self.get_gl_dict(
					{
						"account": account.expense_account,
						"debit": account.amount,
						"credit": 0,
						"cost_center": account.cost_center,
						"remarks": account.notes,
					},
				)
			)

		gl_entries.append(
			self.get_gl_dict(
				{
					"account": self.mode_of_payment_account,
					"debit": 0,
					"credit": self.total_expense,
					"remarks": self.remarks,
				},
			)
		)

		return gl_entries

	def validate_account_currency(self, account, account_currency=None):
		valid_currency = [self.company_currency]

		if account_currency not in valid_currency:
			frappe.throw(
				_("Account {0} is invalid. Account Currency must be {1}").format(
					account, (" " + _("or") + " ").join(valid_currency)
				)
			)

@frappe.whitelist()
def get_expense_type_account_and_cost_center(expense_type, company):
	data = get_expense_type_account(expense_type, company)
	cost_center = erpnext.get_default_cost_center(company)

	return {"account": data.get("account"), "cost_center": cost_center}


@frappe.whitelist()
def get_expense_type_account(expense_type, company):
	account = frappe.db.get_value(
		"Expense Type Account", {"parent": expense_type, "company": company}, "default_account"
	)
	if not account:
		frappe.throw(
			_("Set the default account for the {0} {1}").format(
				frappe.bold("Expense Type"), get_link_to_form("Expense Type", expense_type)
			)
		)

	return {"account": account}