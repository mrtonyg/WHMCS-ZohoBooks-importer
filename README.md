I offer this code without warranty or support, hopefully it helps you. If you find this useful, donate a couple bucks to your favorite charity.
# WHMCS-ZohoBooks-importer
This, when used as a function in Zoho Books(ZB), will import invoices from WHMCS to ZB, with a bit of pre-configuration.

To make this work, you'll need to:

Create an API key in WHMCS for API use, with at least Billing->GetInvoices,Billing->GetInvoice,Billing->UpdateInvoice,Client->GetClient,Client->GetClientsDetails

Create a function in Zoho Books, Settings->Automation->(I put mine in Schedules to have it run every day)

Create a "books connection" via the "Connections" link in the top left when creating a custom function, name it "bookscon"

# Step by step, this function will:
  * Search for invoices in WHMCS where they are status whmcs_invoicesearchstatus
  
  * Iterate over invoices found, getting details for each invoice
  
  * If the invoice notes are not empty( Zoho invoice ID and number are stored here for reference), skip invoice and email zoho admin
  
  * Query WHMCS clients for the userid in the invoice details
  
 *  Get the contents of whmcs_customfield for the userid, this should contain only the ID of the associated zoho contact(ZB->Sales->Customers->click one->Other details->Customer ID)
  
  * If whmcs_customfield is not set, skip invoice and email zoho admin
  
  * Pull the line items from WHMCS invoice(description, amount)
  
  * Puts it together, adds an invoice with gathered information as status type zoho_addasstatus, and Order number as WHMCS invoice ID
  
  * Updates the WHMCS invoice, adding the Zoho ID and invoice number to the WHMCS invoice notes, and changes the status in WHMCS to whmcs_changestatusto
  
  * If update is unsuccessful, emails the zoho admin
  
# You'll need to:
* Create an API key in WHMCS for API use, with at least Billing->GetInvoices,Billing->GetInvoice,Billing->UpdateInvoice,Client->GetClient,Client->GetClientsDetails

* Create a function in Zoho Books, Settings->Automation->(I put mine in Schedules to have it run every day)

* Create a "books connection" via the "Connections" link in the top left when creating a custom function, name it "bookscon"

* Change the variables according to your environment:
  * orgid = YOUR-ZOHO-ORGID;
  * whmcs_id = 'ENTER-WHMCS-API-ID'; // your API ID, found in wrench->system->API credentials
  * whmcs_secret = 'ENTER-WHMCS-API-SECRET'; // your API secret, found in wrench->system->API credentials
  * whmcs_url = "YOUR-WHMCS-URL/includes/api.php";
  * whmcs_accesskey = "ENTER-WHMCS-API-ACCESSKEY"; // your access key, found in your whmcs_config.php file
  * whmcs_customfield="ENTER-CUSTOMFIELD_ID"; // your custom field id, like "customfields2"
  * zoho_addasstatus="draft"; // status type to add invoices to zoho books
  * zoho_payment_terms="60"; // payment terms to add invoice with in zoho books
  * whmcs_invoicesearchstatus="unpaid"; // status type to look for invoices in WHMCS
  * whmcs_changestatusto="Payment Pending"; // status to change WHMCS invoices to after successful addition to zoho books
