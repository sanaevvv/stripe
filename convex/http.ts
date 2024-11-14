import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { api } from './_generated/api';
import stripe from '../src/lib/stripe';
import resend from '../src/lib/resend';
import WelcomeEmail from '../src/emails/WelcomeEmail';

const clerkWebhook = httpAction(async (ctx, request) => {
  const svix_id = request.headers.get('svix-id');
  const svix_signature = request.headers.get('svix-signature');
  const svix_timestamp = request.headers.get('svix-timestamp');

  if (!svix_id || !svix_signature || !svix_timestamp) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret)
    throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');

  const wh = new Webhook(webhookSecret);
  const payload = await request.text();

  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    console.log('Error verifying webhook', error);
    return new Response('Error occurred', { status: 400 });
  }

  // ユーザーをdbに保存
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { clerkId: id },
      });

      await ctx.runMutation(api.users.createUser, {
        email,
        name,
        clerkId: id,
        stripeCustomerId: customer.id,
      });

      if (process.env.NODE_ENV === 'development') {
        await resend.emails.send({
          from: 'Acme <onboarding@resend.dev>',
          to: email,
          subject: 'Hello world',
          react: WelcomeEmail({ name, url: process.env.NEXT_PUBLIC_APP_URL! }),
        });
      }
    } catch (error) {
      console.error('Error creating user in Convex or Stripe', error);
      return new Response('Error creating user', { status: 500 });
    }
  }
  console.log('webhook success!');

  return new Response('webhook processed successfully', { status: 200 });
});

// HTTPルーターインスタンスを作成
const http = httpRouter();

http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: clerkWebhook,
});

export default http;
