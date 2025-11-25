import React from 'react';
import Title from '../components/Title';
import { assets } from '../assets/frontend_assets/assets';
import NewsletterBox from '../components/NewsletterBox';

function Contact() {
    return (
        <div>
            <div className='text-2xl text-center pt-8 border-t-2 border-gray-300'>
                <Title text1='CONTACT' text2='US' />
            </div>
            <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28'>
                <img className='w-full md:max-w-[480px]' src={assets.contact_img} />
                <div className='flex flex-col justify-center items-start gap-6'>
                    <p className='font-semibold text-xl text-gray-600'>Location</p>
                    <p className='text-gray-500'>1365 East 41st<br />Vancouver, BC, V5W1R7</p>
                    <p className='font-semibold text-xl text-gray-600'>Phone</p>
                    <p className='text-gray-500'>6045597833</p>
                    <p className='font-semibold text-xl text-gray-600'>Email</p>
                    <p className='text-gray-500'>Knightstvapeshop@gmail.com</p>
                    <p className='font-semibold text-xl text-gray-600'></p>
                    <p className='text-gray-500'></p>
                    <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>Reach Out</button>
                </div>
            </div>
            <NewsletterBox />
        </div>
    );
}

export default Contact;