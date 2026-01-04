import React from 'react';
import Title from '../components/Title';


function About() {
    return (
        <div>
            <div className='text-2xl text-center pt-8 border-t-2 border-gray-300'>
                <Title text1='ABOUT' text2='US' />
            </div>
            <div className='my-10 flex flex-col md:flex-row gap-16'>
                <img className='w-full md:max-w-[450px]' src='/Grape.jpg' />
                <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
                    <p>Welcome to our store, your premier destination for high-quality vaping products. We are passionate about providing our customers with the best selection of devices, e-liquids, and accessories from top brands in the industry. Our journey began with a simple mission: to offer a curated experience for both beginners and seasoned vapers.</p>
                    <p>We believe in quality, transparency, and exceptional service. Every product on our shelves is carefully selected to ensure it meets our rigorous standards. Whether you are looking for the latest pod system or a classic flavor, we are here to help you find exactly what you need.</p>
                    <b className='text-gray-800'>Our Mission</b>
                    <p>Our mission is to empower adult smokers tailored alternatives. We strive to educate our community, promote responsible usage, and foster a supportive environment where everyone can find their perfect vape.</p>
                </div>
            </div>
            <div className='text-xl py-4'>
                <Title text1='WHY' text2='CHOOSE US' />
            </div>
            <div className='flex flex-col md:flex-row text-sm mb-20'>
                <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 border-gray-300'>
                    <b>Quality Assurance:</b>
                    <p className='text-gray-600'>We source strictly from authorized distributors and manufacturers to guarantee 100% authentic products.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 border-gray-300'>
                    <b>Convenience:</b>
                    <p className='text-gray-600'>Shop online with ease and get your favorite products delivered straight to your door with our fast shipping.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5 border-gray-300'>
                    <b>Exceptional Customer Service:</b>
                    <p className='text-gray-600'>Our knowledgeable support team is always ready to assist you with any questions or concerns you may have.</p>
                </div>
            </div>

        </div>
    );
}

export default About;