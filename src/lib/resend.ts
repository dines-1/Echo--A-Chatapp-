import {Resend} from 'resend'
import { process } from 'zod/v4/core';

const resend = new Resend(process.env.RESEND_API_KEY)