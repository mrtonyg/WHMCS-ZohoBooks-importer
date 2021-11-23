orgid = YOUR-ZOHO-ORGID;
whmcs_id = 'ENTER-WHMCS-API-ID';
whmcs_secret = 'ENTER-WHMCS-API-SECRET';
whmcs_url = "YOUR-WHMCS-URL/includes/api.php";
whmcs_accesskey = "ENTER-WHMCS-API-ACCESSKEY";
whmcs_customfield="ENTER-CUSTOMFIELD_ID";
zoho_addasstatus="draft"; // status type to add invoices to zoho books
zoho_payment_terms="60";
whmcs_invoicesearchstatus="unpaid"; // status type to look for invoices in WHMCS
whmcs_changestatusto="Payment Pending"; // status to change WHMCS invoices to after successful addition to zoho books
/*
Query-loop for unpaid invoices in whmcs
	Query-loop for invoice detail data in whmcs
		Query-loop for client detail in whmcs
			if cf has zohoid:
				Create invoice in Zoho, mark as draft.
				get zoho invoice number, add to whmcs invoice notes
				change whmcs invoice to payment pending
*/
info "-Getting unpaid invoices from WHMCS";
headersBase = Map();
headersBase.put("User-Agent","testing/1.0");
headersBase.put("Accept","application/json");
headersBase.put("Content-Type","application/json");
parametersMap = Map();
parametersMap.put("identifier",whmcs_id);
parametersMap.put("secret",whmcs_secret);
parametersMap.put("action","GetInvoices");
parametersMap.put("responsetype","json");
parametersMap.put("accesskey",whmcs_accesskey);
parametersMap.put("status",whmcs_invoicesearchstatus);
//parametersMap.put("userid","285");
whmcs_getInvoicesResp = invokeurl
    [
    url :whmcs_url
type :POST
parameters:parametersMap
headers:headersBase
];

whmcs_invoicesObj = whmcs_getInvoicesResp.getJson("invoices");
whmcs_results=whmcs_getInvoicesResp.getJson("totalresults");
if(whmcs_results=="0") {
    info "-No unpaid invoices found";

} else {
    whmcs_invoiceObj = whmcs_invoicesObj.getJson("invoice");
    whmcs_invoicesList = whmcs_invoiceObj.toJSONList();
    info   "-Iterating over invoices found";
    for each whmcs_invoice in whmcs_invoicesList
    {
        //iterate over unpaid invoices, get invoice info, then look at related clientid
        whmcs_companyname = whmcs_invoice.get("companyname");
        whmcs_invoiceid = whmcs_invoice.get("id");
        whmcs_invoicenumber = whmcs_invoice.get("invoicenum");
        //get each invoice
        info  "-Found invoice " + whmcs_invoiceid + ", getting invoice details";
        parametersMap = Map();
        parametersMap.put("identifier", whmcs_id);
        parametersMap.put("secret", whmcs_secret);
        parametersMap.put("action", "GetInvoice");
        parametersMap.put("responsetype", "json");
        parametersMap.put("accesskey", "7718c416");
        parametersMap.put("invoiceid", whmcs_invoiceid);
        whmcs_getinvoiceResp = invokeurl
            [
            url
    :
        whmcs_url
        type :POST
        parameters:parametersMap
        headers:headersBase
    ]
        ;

        whmcs_getinvoiceObj = whmcs_getinvoiceResp.getJson("items");
        whmcs_getinvoiceitemObj = whmcs_getinvoiceObj.getJson("item");
        whmcs_getinvoiceList = whmcs_getinvoiceitemObj.toJSONList();
        whmcs_userid = whmcs_getinvoiceResp.getJson("userid");
        whmcs_notes = whmcs_getinvoiceResp.getJson("notes");
        if(whmcs_notes!="") {
            info "-Notes are not empty on WHMCS Invoice "+whmcs_invoiceid+", skipping";
            msgsubject="WHMCS Invoice Importer";
            msgmessage="-Notes are not empty on WHMCS Invoice "+whmcs_invoiceid+", skipping";
            sendmail
                [
                from: zoho.adminuserid
            to: zoho.adminuserid
            subject: msgsubject
            message: msgmessage
        ]
        } else {
            whmcs_invoiceid = whmcs_getinvoiceResp.getJson("invoiceid");
            //we now have the userid, get the client info for the zohoid
            info
            "-Looking up user id " + whmcs_userid + "(" + whmcs_companyname + ") in WHMCS";

            parametersMap = Map();
            parametersMap.put("identifier", whmcs_id);
            parametersMap.put("secret", whmcs_secret);
            parametersMap.put("action", "GetClientsDetails");
            parametersMap.put("responsetype", "json");
            parametersMap.put("accesskey", "7718c416");
            parametersMap.put("clientid", whmcs_userid);
            parametersMap.put("stats", "0");
            whmcs_getClientResp = invokeurl
                [
                url
        :
            whmcs_url
            type :POST
            parameters:parametersMap
            headers:headersBase
        ]
            ;

            whmcs_zohoid = whmcs_getClientResp.getJson(whmcs_customfield);
            if (whmcs_zohoid == "") {
                info
                "--User does not have a Zoho ID in CF";
                msgsubject = "WHMCS Invoice Importer";
                msgmessage = whmcs_userid + "(" + whmcs_companyname + ")--User does not have a Zoho ID in CF";
                sendmail
                    [
                    from
            :
                zoho.adminuserid
                to: zoho.adminuserid
                subject: msgsubject
                message: msgmessage
            ]
            } else {
                info
                "-Found Zoho ID";
                info
                "-Getting invoice items from WHMCS";
                whmcs_lineitems = List();
                for each  item in whmcs_getinvoiceList
                {
                    //get userid from invoice, lookup user, get cf

                    mapVar = Map();
                    mapVar.put("name", item.get("description"));
                    mapVar.put("rate", item.get("amount"));
                    mapVar.put("quantity", "1");
                    whmcs_lineitems.add(mapVar);
                }
                values = Map();
                values.put("customer_id", whmcs_zohoid);
                values.put("status", zoho_addasstatus);
                values.put("payment_terms", zoho_payment_terms);
                values.put("reference_number", whmcs_invoiceid);
                values.put("line_items", whmcs_lineitems);
                createResp = zoho.books.createRecord("Invoices", orgid, values, "bookscon");
                zoho_createInvoiceObj = createResp.getJSON("invoice");
                zoho_invoice_id = zoho_createInvoiceObj.getJSON("invoice_id");
                zoho_invoicenumber = zoho_createInvoiceObj.getJSON("invoice_number");
                info
                "-Created Zoho Invoice ID: " + zoho_invoice_id;
                info
                "-Created Zoho Invoice Number: " + zoho_invoicenumber;



                info
                "-Adding Zoho id to WHMCS invoice and changing status";
                parametersMap = Map();
                parametersMap.put("identifier", whmcs_id);
                parametersMap.put("secret", whmcs_secret);
                parametersMap.put("action", "UpdateInvoice");
                parametersMap.put("responsetype", "json");
                parametersMap.put("accesskey", "7718c416");
                parametersMap.put("invoiceid", whmcs_invoiceid);
                parametersMap.put("status", whmcs_changestatusto);
                parametersMap.put("notes", zoho_invoice_id + ":" + zoho_invoicenumber);
                whmcs_updateInvoiceResp = invokeurl
                    [
                    url
            :
                whmcs_url
                type :POST
                parameters:parametersMap
                headers:headersBase
            ]
                ;

                whmcs_updateStatus = whmcs_updateInvoiceResp.getJson("result");
                info
                "-Updated WHMCS invoice " + whmcs_invoiceid + " status: " + whmcs_updateStatus;
                if (whmcs_updateStatus != "success") {
                    msgsubject = "WHMCS Invoice Importer";
                    msgmessage = whmcs_userid + "(" + whmcs_companyname + ")---Updated WHMCS invoice " + whmcs_invoiceid + " status: " + whmcs_updateStatus;
                    sendmail
                        [
                        from
                :
                    zoho.adminuserid
                    to: zoho.adminuserid
                    subject: msgsubject
                    message: msgmessage
                ]
                }

            }
        }
    }
}

