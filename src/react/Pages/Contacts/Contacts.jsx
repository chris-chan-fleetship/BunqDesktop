import React from "react";
import { connect } from "react-redux";
import Helmet from "react-helmet";
import { translate } from "react-i18next";
import { ipcRenderer } from "electron";
import Grid from "material-ui/Grid";
import Paper from "material-ui/Paper";

import fs from "../../ImportWrappers/fs";
const vcf = require("vcf");
const remote = require("electron").remote;
const dialog = remote.dialog;

import TranslateTypography from "../../Components/TranslationHelpers/Typography";
import TranslateButton from "../../Components/TranslationHelpers/Button";
import ContactList from "./ContactList";
import ContactHeader from "./ContactHeader";

import { openSnackbar } from "../../Actions/snackbar";
import {
    contactInfoUpdateGoogle,
    contactInfoUpdateOffice365,
    contactsClear,
    contactsSetInfoType
} from "../../Actions/contacts";

const styles = {
    title: {
        margin: 16
    },
    body: {
        margin: 16,
        textAlign: "center"
    },
    button: {
        width: "100%"
    },
    logo: {
        width: 20,
        marginLeft: 16
    }
};

class Contacts extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            googleAccessToken: false,
            office365AccessToken: false,

            shownContacts: {},

            contacts: {}
        };

        ipcRenderer.on(
            "received-oauth-google-access-token",
            this.handleGoogleCallback
        );
        ipcRenderer.on(
            "received-oauth-office-365-access-token",
            this.handleOffice365Callback
        );
        ipcRenderer.on("received-oauth-failed", this.handleError);
    }

    handleError = event => {
        const failedMessage = this.props.t(
            "Failed to validate the authentication tokens"
        );

        this.props.openSnackbar(failedMessage);
    };

    openGoogleConsentScreen = event => {
        ipcRenderer.send("open-google-oauth");
    };
    handleGoogleCallback = (event, accessToken) => {
        this.setState({
            googleAccessToken: accessToken
        });
    };
    getGoogleContacts = event => {
        this.props.contactInfoUpdateGoogle(this.state.googleAccessToken);
    };

    getAppleContacts = event => {
        dialog.showOpenDialog(
            {
                properties: ["openFile"],
                filters: [{ name: "vCards", extensions: ["vcf"] }]
            },
            this.handleAppleFileChange
        );
    };
    handleAppleFileChange = filePaths => {
        if (filePaths && filePaths.length > 0) {
            const content = fs.readFileSync(filePaths[0]);
            const result = vcf.parse(content.toString());

            if (result.data) {
                // single vcard
                console.log(result.data);
            } else {
                result.forEach((vCardItem) => {
                    const data = vCardItem.data;
                    console.log(data);

                    if(data.tel){

                    }
                    if(data.email){

                    }

                });
            }
        }
    };

    openOfficeConsentScreen = event => {
        ipcRenderer.send("open-office-365-oauth");
    };
    handleOffice365Callback = (event, accessToken) => {
        this.setState({
            office365AccessToken: accessToken
        });
    };
    getOfficeContacts = event => {
        this.props.contactInfoUpdateOffice365(this.state.office365AccessToken);
    };

    toggleContactType = type => {
        const shownContacts = this.state.shownContacts;
        shownContacts[type] = !shownContacts[type];
        this.setState({ shownContacts: shownContacts });
    };

    removeContact = (sourceType, contactKey, itemKey, itemType) => event => {
        if (
            this.props.contacts[sourceType] &&
            this.props.contacts[sourceType][contactKey]
        ) {
            const contacts = this.props.contacts[sourceType];

            if (itemType === "EMAIL") {
                // remove this email from the list
                contacts[contactKey].emails.splice(itemKey, 1);
            } else if (itemType === "PHONE") {
                // remove this phonenumber from the list
                contacts[contactKey].phoneNumbers.splice(itemKey, 1);
            }

            if (
                contacts[contactKey].emails.length === 0 &&
                contacts[contactKey].phoneNumbers.length === 0
            ) {
                // remove this entire contact since no emails/phonenumbers are left
                contacts.splice(contactKey, 1);
            }

            // set the new contacts
            this.props.contactsSetInfoType(contacts, contactKey);
        }
    };

    render() {
        const { t, contacts } = this.props;

        return (
            <Grid container spacing={16} justify={"center"}>
                <Helmet>
                    <title>{`BunqDesktop - ${t("Contacts")}`}</title>
                </Helmet>

                <Grid item xs={12} sm={10} md={12}>
                    <Grid container justify={"center"} spacing={8}>
                        <Grid item xs={8} md={9} lg={10}>
                            <TranslateTypography variant={"headline"}>
                                Contacts
                            </TranslateTypography>
                        </Grid>

                        <Grid
                            item
                            xs={4}
                            md={3}
                            lg={2}
                            style={{ textAlign: "right" }}
                        >
                            <TranslateButton
                                variant="raised"
                                color="secondary"
                                style={styles.button}
                                disabled={this.props.contactsLoading}
                                onClick={() => this.props.clearContacts()}
                            >
                                Clear all
                            </TranslateButton>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} sm={10} md={6} lg={4}>
                    <Paper>
                        <ContactHeader
                            title="Google Contacts"
                            contactType="GoogleContacts"
                            logo="./images/google-logo.svg"
                            canImport={!!this.state.googleAccessToken}
                            loading={this.props.contactsLoading}
                            clear={this.props.clearContacts}
                            import={this.getGoogleContacts}
                            login={this.openGoogleConsentScreen}
                        />

                        <ContactList
                            contacts={contacts}
                            contactType={"GoogleContacts"}
                            shownContacts={this.state.shownContacts}
                            removeContact={this.removeContact}
                            toggleContactType={this.toggleContactType}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={10} md={6} lg={4}>
                    <Paper>
                        <ContactHeader
                            title="Apple Contacts"
                            contactType="AppleContacts"
                            logo="./images/apple-logo.svg"
                            canImport={true}
                            loading={this.props.contactsLoading}
                            clear={this.props.clearContacts}
                            import={this.getAppleContacts}
                            login={() => {}}
                        />

                        <ContactList
                            contacts={contacts}
                            contactType={"AppleContacts"}
                            shownContacts={this.state.shownContacts}
                            removeContact={this.removeContact}
                            toggleContactType={this.toggleContactType}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={10} md={6} lg={4}>
                    <Paper>
                        <ContactHeader
                            title="Office 365 Contacts"
                            contactType="Office365"
                            logo="./images/office-365-logo.svg"
                            canImport={!!this.state.office365AccessToken}
                            loading={this.props.contactsLoading}
                            clear={this.props.clearContacts}
                            import={this.getOfficeContacts}
                            login={this.openOfficeConsentScreen}
                        />

                        <ContactList
                            contacts={contacts}
                            contactType={"Office365"}
                            shownContacts={this.state.shownContacts}
                            removeContact={this.removeContact}
                            toggleContactType={this.toggleContactType}
                        />
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

const mapStateToProps = state => {
    return {
        contacts: state.contacts.contacts,
        contactsLoading: state.contacts.loading,
        contactsLastUpdate: state.contacts.last_update
    };
};

const mapDispatchToProps = (dispatch, props) => {
    const { BunqJSClient } = props;
    return {
        contactInfoUpdateGoogle: accessToken =>
            dispatch(contactInfoUpdateGoogle(BunqJSClient, accessToken)),
        contactInfoUpdateOffice365: accessToken =>
            dispatch(contactInfoUpdateOffice365(BunqJSClient, accessToken)),
        contactsSetInfoType: (contacts, type) =>
            dispatch(contactsSetInfoType(contacts, type, BunqJSClient)),
        clearContacts: (type = false) =>
            dispatch(contactsClear(BunqJSClient, type)),
        openSnackbar: message => dispatch(openSnackbar(message))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(
    translate("translations")(Contacts)
);
