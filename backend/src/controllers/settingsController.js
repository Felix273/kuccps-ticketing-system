const { PrismaClient } = require('@prisma/client');
const { clearSettingsCache } = require('../services/emailService');

const prisma = new PrismaClient();

function getInitialEmailSettings() {
  return {
    smtpHost: process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT, 10) || 587,
    smtpSecure: String(process.env.SMTP_SECURE || process.env.EMAIL_SMTP_SECURE || '').toLowerCase() === 'true',
    smtpUser: process.env.SMTP_USER || process.env.EMAIL_USER || null,
    smtpPassword: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || null,
    imapHost: process.env.IMAP_HOST || 'imap.gmail.com',
    imapPort: parseInt(process.env.IMAP_PORT, 10) || 993,
    imapUser: process.env.IMAP_USER || process.env.EMAIL_USER || null,
    imapPassword: process.env.IMAP_PASSWORD || null,
    imapEnabled: String(process.env.IMAP_ENABLED || '').toLowerCase() === 'true',
    imapPollInterval: parseInt(process.env.EMAIL_POLL_INTERVAL || process.env.IMAP_POLL_INTERVAL, 10) || 5,
    ldapEnabled: String(process.env.LDAP_ENABLED || process.env.USE_LDAP_AUTH || '').toLowerCase() === 'true',
    ldapUrl: process.env.LDAP_URL || null,
    ldapBaseDn: process.env.LDAP_BASE_DN || null,
    ldapUserDnPrefix: process.env.LDAP_USER_DN_PREFIX || 'sAMAccountName',
    ldapBindDn: process.env.LDAP_BIND_DN || null,
    ldapBindPassword: process.env.LDAP_BIND_PASSWORD || null,
    ldapDomain: process.env.LDAP_DOMAIN || null,
    ldapUserSearchBase: process.env.LDAP_USER_SEARCH_BASE || process.env.LDAP_BASE_DN || null,
    ldapUserFilter: process.env.LDAP_USER_FILTER || '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
    ldapDirectorateSearchBase: process.env.LDAP_DIRECTORATE_SEARCH_BASE || process.env.LDAP_BASE_DN || null,
    ldapDirectorateFilter: process.env.LDAP_DIRECTORATE_FILTER || '(|(objectClass=organizationalUnit)(objectClass=group))',
    ldapUsernameAttribute: process.env.LDAP_USERNAME_ATTRIBUTE || 'sAMAccountName',
    ldapEmailAttribute: process.env.LDAP_EMAIL_ATTRIBUTE || 'mail',
    ldapNameAttribute: process.env.LDAP_NAME_ATTRIBUTE || 'displayName',
    ldapDepartmentAttribute: process.env.LDAP_DEPARTMENT_ATTRIBUTE || 'department',
    ldapIctGroupDn: process.env.LDAP_ICT_GROUP_DN || null,
    ldapIctUserFilter: process.env.LDAP_ICT_USER_FILTER || null,
    ldapDefaultRole: process.env.LDAP_DEFAULT_ROLE || 'user',
    ldapSyncUsersEnabled: String(process.env.LDAP_SYNC_USERS_ENABLED || 'true').toLowerCase() !== 'false'
  };
}

exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: getInitialEmailSettings()
      });
    }

    const safeSettings = {
      ...settings,
      smtpPassword: settings.smtpPassword ? '********' : null,
      imapPassword: settings.imapPassword ? '********' : null,
      ldapBindPassword: settings.ldapBindPassword ? '********' : null
    };

    res.json({ success: true, settings: safeSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      organizationName,
      organizationCode,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      supportEmail,
      noreplyEmail,
      emailFromName,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
      _newSmtpPassword,
      imapHost,
      imapPort,
      imapUser,
      imapPassword,
      _newImapPassword,
      imapEnabled,
      imapPollInterval,
      ldapEnabled,
      ldapUrl,
      ldapBaseDn,
      ldapUserDnPrefix,
      ldapBindDn,
      ldapBindPassword,
      _newLdapBindPassword,
      ldapDomain,
      ldapUserSearchBase,
      ldapUserFilter,
      ldapDirectorateSearchBase,
      ldapDirectorateFilter,
      ldapUsernameAttribute,
      ldapEmailAttribute,
      ldapNameAttribute,
      ldapDepartmentAttribute,
      ldapIctGroupDn,
      ldapIctUserFilter,
      ldapDefaultRole,
      ldapSyncUsersEnabled,
      ticketNumberPrefix,
      ticketNumberFormat,
      defaultPriority,
      defaultCategory,
      defaultStatus,
      googleAddonApiUrl,
      googleAddonEnabled,
      maxFileSize,
      allowedFileTypes,
      maintenanceMode,
      maintenanceMessage,
      darkModeEnabled,
      contrastMode
    } = req.body;

    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: getInitialEmailSettings()
      });
    }

    const updateData = {};
    if (organizationName !== undefined) updateData.organizationName = organizationName;
    if (organizationCode !== undefined) updateData.organizationCode = organizationCode;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
    if (noreplyEmail !== undefined) updateData.noreplyEmail = noreplyEmail;
    if (emailFromName !== undefined) updateData.emailFromName = emailFromName;
    if (smtpHost !== undefined) updateData.smtpHost = smtpHost;
    if (smtpPort !== undefined) updateData.smtpPort = smtpPort;
    if (smtpSecure !== undefined) updateData.smtpSecure = smtpSecure;
    if (smtpUser !== undefined) updateData.smtpUser = smtpUser;
    const nextSmtpPassword = _newSmtpPassword || smtpPassword;
    if (nextSmtpPassword !== undefined && nextSmtpPassword !== '' && nextSmtpPassword !== '********') {
      updateData.smtpPassword = nextSmtpPassword;
    }
    if (imapHost !== undefined) updateData.imapHost = imapHost;
    if (imapPort !== undefined) updateData.imapPort = imapPort;
    if (imapUser !== undefined) updateData.imapUser = imapUser;
    const nextImapPassword = _newImapPassword || imapPassword;
    if (nextImapPassword !== undefined && nextImapPassword !== '' && nextImapPassword !== '********') {
      updateData.imapPassword = nextImapPassword;
    }
    if (imapEnabled !== undefined) updateData.imapEnabled = imapEnabled;
    if (imapPollInterval !== undefined) updateData.imapPollInterval = imapPollInterval;
    if (ldapEnabled !== undefined) updateData.ldapEnabled = ldapEnabled;
    if (ldapUrl !== undefined) updateData.ldapUrl = ldapUrl;
    if (ldapBaseDn !== undefined) updateData.ldapBaseDn = ldapBaseDn;
    if (ldapUserDnPrefix !== undefined) updateData.ldapUserDnPrefix = ldapUserDnPrefix;
    if (ldapBindDn !== undefined) updateData.ldapBindDn = ldapBindDn;
    const nextLdapBindPassword = _newLdapBindPassword || ldapBindPassword;
    if (nextLdapBindPassword !== undefined && nextLdapBindPassword !== '' && nextLdapBindPassword !== '********') {
      updateData.ldapBindPassword = nextLdapBindPassword;
    }
    if (ldapDomain !== undefined) updateData.ldapDomain = ldapDomain;
    if (ldapUserSearchBase !== undefined) updateData.ldapUserSearchBase = ldapUserSearchBase;
    if (ldapUserFilter !== undefined) updateData.ldapUserFilter = ldapUserFilter;
    if (ldapDirectorateSearchBase !== undefined) updateData.ldapDirectorateSearchBase = ldapDirectorateSearchBase;
    if (ldapDirectorateFilter !== undefined) updateData.ldapDirectorateFilter = ldapDirectorateFilter;
    if (ldapUsernameAttribute !== undefined) updateData.ldapUsernameAttribute = ldapUsernameAttribute;
    if (ldapEmailAttribute !== undefined) updateData.ldapEmailAttribute = ldapEmailAttribute;
    if (ldapNameAttribute !== undefined) updateData.ldapNameAttribute = ldapNameAttribute;
    if (ldapDepartmentAttribute !== undefined) updateData.ldapDepartmentAttribute = ldapDepartmentAttribute;
    if (ldapIctGroupDn !== undefined) updateData.ldapIctGroupDn = ldapIctGroupDn;
    if (ldapIctUserFilter !== undefined) updateData.ldapIctUserFilter = ldapIctUserFilter;
    if (ldapDefaultRole !== undefined) updateData.ldapDefaultRole = ldapDefaultRole;
    if (ldapSyncUsersEnabled !== undefined) updateData.ldapSyncUsersEnabled = ldapSyncUsersEnabled;
    if (ticketNumberPrefix !== undefined) updateData.ticketNumberPrefix = ticketNumberPrefix;
    if (ticketNumberFormat !== undefined) updateData.ticketNumberFormat = ticketNumberFormat;
    if (defaultPriority !== undefined) updateData.defaultPriority = defaultPriority;
    if (defaultCategory !== undefined) updateData.defaultCategory = defaultCategory;
    if (defaultStatus !== undefined) updateData.defaultStatus = defaultStatus;
    if (googleAddonApiUrl !== undefined) updateData.googleAddonApiUrl = googleAddonApiUrl;
    if (googleAddonEnabled !== undefined) updateData.googleAddonEnabled = googleAddonEnabled;
    if (maxFileSize !== undefined) updateData.maxFileSize = maxFileSize;
    if (allowedFileTypes !== undefined) updateData.allowedFileTypes = allowedFileTypes;
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (maintenanceMessage !== undefined) updateData.maintenanceMessage = maintenanceMessage;
    if (darkModeEnabled !== undefined) updateData.darkModeEnabled = darkModeEnabled;
    if (contrastMode !== undefined) updateData.contrastMode = contrastMode;

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData
    });

    const safeSettings = {
      ...updated,
      smtpPassword: updated.smtpPassword ? '********' : null,
      imapPassword: updated.imapPassword ? '********' : null,
      ldapBindPassword: updated.ldapBindPassword ? '********' : null
    };

    clearSettingsCache();

    res.json({ success: true, message: 'Settings updated successfully', settings: safeSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

exports.getPublicSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {}
      });
    }

    const publicSettings = {
      organizationName: settings.organizationName,
      organizationCode: settings.organizationCode,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl || '/kuccps-logo.png',
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      supportEmail: settings.supportEmail,
      ticketNumberPrefix: settings.ticketNumberPrefix,
      darkModeEnabled: settings.darkModeEnabled,
      contrastMode: settings.contrastMode
    };

    res.json({ success: true, settings: publicSettings });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// Email Template Management
exports.getEmailTemplates = async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany();
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
};

exports.getEmailTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const template = await prisma.emailTemplate.findUnique({
      where: { type }
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Email template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email template' });
  }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const { type, subject, html } = req.body;

    // Check if template already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { type }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email template already exists for this type' });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        type,
        subject,
        html
      }
    });

    res.json({ success: true, message: 'Email template created successfully', template });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ success: false, message: 'Failed to create email template' });
  }
};

exports.updateEmailTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const { subject, html } = req.body;

    const template = await prisma.emailTemplate.update({
      where: { type },
      data: {
        subject,
        html
      }
    });

    res.json({ success: true, message: 'Email template updated successfully', template });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ success: false, message: 'Failed to update email template' });
  }
};

exports.deleteEmailTemplate = async (req, res) => {
  try {
    const { type } = req.params;

    await prisma.emailTemplate.delete({
      where: { type }
    });

    res.json({ success: true, message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete email template' });
  }
};

exports.resetEmailTemplatesToDefault = async (req, res) => {
  try {
    // Delete existing templates
    await prisma.emailTemplate.deleteMany({});

    // Create default templates
    const defaultTemplates = [
      {
        type: 'ticketCreated',
        subject: '[Ticket #{{ticketNumber}}] Your support request has been received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">{{emailFromName}}</h1>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #111827;">Ticket Created Successfully</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Hello,
              </p>

              <p style="color: #4b5563; font-size: 16px;">
                Your support ticket has been created and assigned ticket number <strong>{{ticketNumber}}</strong>.
              </p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {{primaryColor}};">
                <h3 style="margin-top: 0; color: #111827;">Ticket Details</h3>
                <p style="margin: 10px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 10px 0;"><strong>Priority:</strong> {{priority}}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> {{status}}</p>
                <p style="margin: 10px 0;"><strong>Category:</strong> {{category}}</p>
              </div>

              <p style="color: #4b5563; font-size: 16px;">
                Our IT team will review your request and respond as soon as possible. You will receive email updates when there are changes to your ticket.
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Please do not reply to this automated email. Contact ICT directly at {{supportEmail}} if you need to follow up.
              </p>
            </div>

            <div style="background-color: {{primaryColor}}; padding: 20px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                © {{year}} {{organizationName}}. All rights reserved.
              </p>
            </div>
          </div>
        `
      },
      {
        type: 'ticketUpdated',
        subject: '[Ticket #{{ticketNumber}}] Update on your support request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">{{emailFromName}}</h1>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #111827;">Ticket Update</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Hello,
              </p>

              <p style="color: #4b5563; font-size: 16px;">
                There's an update on your ticket <strong>{{ticketNumber}}</strong>.
              </p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {{primaryColor}};">
                <h3 style="margin-top: 0; color: #111827;">Current Status</h3>
                <p style="margin: 10px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> {{status}}</p>
                <p style="margin: 10px 0;"><strong>Priority:</strong> {{priority}}</p>
              </div>

              {{#if comment}}
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #111827;">Latest Response</h3>
                <p style="color: #374151; white-space: pre-wrap;">{{comment}}</p>
              </div>
              {{/if}}

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Please do not reply to this automated email. Contact ICT directly at {{supportEmail}} if you need to follow up.
              </p>
            </div>

            <div style="background-color: {{primaryColor}}; padding: 20px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                © {{year}} {{organizationName}}. All rights reserved.
              </p>
            </div>
          </div>
        `
      },
      {
        type: 'ticketResolved',
        subject: '[Ticket #{{ticketNumber}}] Your support request has been resolved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">{{emailFromName}}</h1>
            </div>

            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #111827;">✓ Ticket Resolved</h2>

              <p style="color: #4b5563; font-size: 16px;">
                Hello,
              </p>

              <p style="color: #4b5563; font-size: 16px;">
                Great news! Your support ticket <strong>{{ticketNumber}}</strong> has been resolved.
              </p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #111827;">Ticket Details</h3>
                <p style="margin: 10px 0;"><strong>Subject:</strong> {{subject}}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> {{status}}</p>
              </div>

              {{#if resolutionComment}}
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #111827;">Resolution Details</h3>
                <p style="color: #374151; white-space: pre-wrap;">{{resolutionComment}}</p>
              </div>
              {{/if}}

              <p style="color: #4b5563; font-size: 16px;">
                If you're satisfied with the resolution, no further action is needed. Please do not reply to this automated email. Contact ICT directly at {{supportEmail}} if you need additional assistance.
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for using {{emailFromName}}!
              </p>
            </div>

            <div style="background-color: {{primaryColor}}; padding: 20px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 14px;">
                © {{year}} {{organizationName}}. All rights reserved.
              </p>
            </div>
          </div>
        `
      }
    ];

    // Insert default templates
    for (const templateData of defaultTemplates) {
      await prisma.emailTemplate.create({
        data: templateData
      });
    }

    res.json({ success: true, message: 'Email templates reset to default successfully' });
  } catch (error) {
    console.error('Error resetting email templates:', error);
    res.status(500).json({ success: false, message: 'Failed to reset email templates' });
  }
};

module.exports = exports;
