import { describe, expect, it, beforeEach, afterAll, jest } from '@jest/globals';
import sendEmail from '../../src/utils/sendEmail';
import sgMail from '@sendgrid/mail';

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

const sgMailMock = sgMail as any;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

describe('sendEmail utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SENDGRID_API_KEY = 'test-key';
    process.env.SENDGRID_FROM_EMAIL = 'from@example.com';
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  it('should configure SendGrid and send email', async () => {
    sgMailMock.send.mockResolvedValueOnce(undefined);

    await sendEmail('user@example.com', 'Subject', 'Body');

    expect(sgMailMock.setApiKey).toHaveBeenCalledWith('test-key');
    expect(sgMailMock.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      from: 'from@example.com',
      subject: 'Subject',
      text: 'Body',
      html: '<p>Body</p>',
    });
  });

  it('should throw when SENDGRID_API_KEY is missing', async () => {
    delete process.env.SENDGRID_API_KEY;

    await expect(sendEmail('user@example.com', 'Subject', 'Body')).rejects.toThrow(
      'No se pudo enviar el correo'
    );
    expect(sgMailMock.setApiKey).not.toHaveBeenCalled();
  });

  it('should throw when SENDGRID_FROM_EMAIL is missing', async () => {
    delete process.env.SENDGRID_FROM_EMAIL;

    await expect(sendEmail('user@example.com', 'Subject', 'Body')).rejects.toThrow(
      'No se pudo enviar el correo'
    );
    expect(sgMailMock.setApiKey).not.toHaveBeenCalled();
  });

  it('should throw when SendGrid send fails', async () => {
    sgMailMock.send.mockRejectedValueOnce(new Error('boom'));

    await expect(sendEmail('user@example.com', 'Subject', 'Body')).rejects.toThrow(
      'No se pudo enviar el correo'
    );
  });

  it('should log SendGrid response body when available', async () => {
    const error = new Error('boom') as Error & { response?: { body: unknown } };
    error.response = { body: { message: 'bad-request' } };
    sgMailMock.send.mockRejectedValueOnce(error);

    await expect(sendEmail('user@example.com', 'Subject', 'Body')).rejects.toThrow(
      'No se pudo enviar el correo'
    );
  });
});


