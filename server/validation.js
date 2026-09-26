import { z } from 'zod';
import { cents } from './domain.js';
const text=z.string().max(10000);
const money=z.number().finite().nonnegative().max(1e12).nullable().refine(v=>v==null||Number.isSafeInteger(Math.round(v*100))&&Math.abs(v*100-Math.round(v*100))<.00001,'Use amounts with at most two decimals');
export const profileSchema=z.object({
 company:z.object({name:text.default(''),industry:text.nullable().default(null),location:text.nullable().default(null)}).passthrough(),
 funding:z.object({amount:money,currency:z.literal('NZD').default('NZD'),purpose:text.nullable().default(null),purposes:z.array(z.string()).default([]),termMonths:z.number().int().positive().max(600).nullable().default(null),security:z.array(z.string()).default([]),targetBasis:z.enum(['facility_limits','cash_at_close']).default('facility_limits')}).passthrough(),
 financials:z.object({annualRevenue:z.object({amount:money}).passthrough(),ebitda:z.object({amount:z.number().finite().nullable()}).passthrough()}).passthrough(),
 facilities:z.array(z.object({id:z.string().min(1).max(100),name:text,amount:money,currency:z.literal('NZD').default('NZD'),termMonths:z.number().int().positive().nullable(),type:z.string(),security:z.array(z.string()),purposes:z.array(z.string()),drawAtClose:money.optional()}).passthrough()).max(6).optional(),
}).passthrough();
export function validate(schema,input){const r=schema.safeParse(input);if(!r.success)throw Object.assign(new Error(r.error.issues.map(e=>e.path.join('.')+': '+e.message).join('; ')),{status:422});return r.data;}
export function cleanProfile(input){const p=validate(profileSchema,input);cents(p.funding.amount);p.synthetic=true;if(p.facilities&&new Set(p.facilities.map(f=>f.id)).size!==p.facilities.length)throw Object.assign(new Error('Facility identifiers must be unique.'),{status:422});for(const f of p.facilities||[])cents(f.amount);for(const k of ['refinancePayoffs','closingFees'])if(p.funding[k]!=null)cents(p.funding[k]);p.documents ||= [];p.review ||= {fields:{},conflicts:[],confirmedFields:[],proposedValues:{}};return p;}
export const versionSchema=z.number().int().positive();
export const shortText=z.string().trim().min(1).max(300);
export const dateSchema=z.string().datetime({offset:true}).nullable();
export {z};

const categories=z.array(z.string().trim().min(1).max(150)).max(100).optional();
const dated=z.union([z.iso.date(),z.iso.datetime({offset:true})]).nullable().optional();
const optionalText=z.string().max(1000).nullable().optional();
export const mandateSchema=z.object({
 source:z.string().trim().min(1).max(1000),currency:z.literal('NZD'),
 participationMin:money.optional(),participationMax:money.optional(),providerLimit:money.optional(),availableCapital:money.optional(),poolLimit:money.optional(),minDeal:money.optional(),maxDeal:money.optional(),transactionMin:money.optional(),transactionMax:money.optional(),
 coLend:z.boolean().nullable().optional(),exclusive:z.boolean().optional(),canLead:z.boolean().optional(),
 capacityAsAt:dated,validUntil:dated,deploymentDeadline:dated,availableFrom:dated,
 sectors:categories,excludedSectors:categories,countries:categories,regions:categories,purposes:categories,facilityTypes:categories,security:categories,
 minTerm:z.number().int().positive().nullable().optional(),maxTerm:z.number().int().positive().nullable().optional(),minEbitda:z.number().finite().nullable().optional(),maxLeverage:z.number().finite().nonnegative().nullable().optional(),
 leverageType:optionalText,securityGroup:optionalText,poolId:optionalText,appetite:optionalText,
 amountScope:z.enum(['facility','participation','unknown']).optional()
}).passthrough().superRefine((m,ctx)=>{
 for(const [min,max] of [['participationMin','participationMax'],['minDeal','maxDeal'],['transactionMin','transactionMax'],['minTerm','maxTerm']])if(m[min]!=null&&m[max]!=null&&m[min]>m[max])ctx.addIssue({code:'custom',path:[min],message:'Minimum cannot exceed maximum'});
 if(m.availableFrom&&m.deploymentDeadline&&new Date(m.availableFrom)>new Date(m.deploymentDeadline))ctx.addIssue({code:'custom',path:['availableFrom'],message:'Availability must precede the deployment deadline'});
});
