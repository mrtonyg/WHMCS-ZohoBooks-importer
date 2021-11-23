# WHMCS-ZohoBooks-importer
This, when used as a function in Zoho Books(ZB), will import invoices from WHMCS to ZB, with a bit of pre-configuration.
To make this work, you'll need to:
Create an API key in WHMCS for API use, with at least Billing->GetInvoices,Billing->GetInvoice,Billing->UpdateInvoice,Client->GetClient,Client->GetClientsDetails
Create a function in Zoho Books, Settings->Automation->(I put mine in Schedules to have it run every day)
Create a "books connection" via the "Connections" link in the top left when creating a custom function

Step by step, this function will:
  Search for invoices in WHMCS where they are status whmcs_invoicesearchstatus
  Iterate over invoices found, getting details for each invoice
  If the invoice notes are not empty( Zoho invoice ID and number are stored here for reference), skip invoice and email zoho admin
  Query WHMCS clients for the userid in the invoice details
  Get the contents of whmcs_customfield for the userid, this should contain only the ID of the associated zoho contact(ZB->Sales->Customers->click one->Other details->Customer ID)
  If whmcs_customfield is not set, skip invoice and email zoho admin
  Pull the line items from WHMCS invoice(description, amount)
  Puts it together, adds an invoice with gathered information as status type zoho_addasstatus, and Order number as WHMCS invoice ID
  Updates the WHMCS invoice, adding the Zoho ID and invoice number to the WHMCS invoice notes, and changes the status in WHMCS to whmcs_changestatusto
  If update is unsuccessful, emails the zoho admin
  
