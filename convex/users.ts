import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (existingUser) {
      console.log('User already exists');
      return existingUser._id;
    }

    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      clerkId: args.clerkId,
      stripeCustomerId: args.stripeCustomerId,
    });

    return userId;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();
  },
});

export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_stripeCustomerId', (q) =>
        q.eq('stripeCustomerId', args.stripeCustomerId),
      )
      .unique();
  },
});

export const getUserAccess = query({
  args: { userId: v.id('users'), courseId: v.id('courses') },
  handler: async (ctx, args) => {
    // Convexの認証システムを通じて、現在のセッションに関連付けられたユーザーの身元情報を取得
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('UnAuthorized');
    }

    // データベースから特定のユーザーの詳細情報を取得;
    const user = await ctx.db.get(args.userId);

    if (!user) throw new ConvexError('User not Found');

    // サブスクの確認
    if (user.currentSubscriptionId) {
      const subscription = await ctx.db.get(user?.currentSubscriptionId);

      if (subscription && subscription.status === 'active') {
        return {
          hasAccess: true,
          accessType: 'subscription',
        };
      }
    }

    // 各コースの確認
    const purchase = await ctx.db
      .query('purchases')
      .withIndex('by_userId_and_courseId', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId),
      )
      .unique();

    if (purchase) {
      return {
        hasAccess: true,
        accessType: 'course',
      };
    }

    return { hasAccess: false };
  },
});
