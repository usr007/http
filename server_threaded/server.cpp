//
// server.cpp
// ~~~~~~~~~~
//
// Copyright (c) 2003-2015 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#include "server.hpp"
#include <signal.h>
#include <utility>
#include <functional>

namespace http {
	namespace server {

		server::server(const std::string& address, const std::string& port,
			const std::string& doc_root, std::size_t thread_pool_size)
			:thread_pool_size_(thread_pool_size),
			io_service_(),
			signals_(io_service_),
			acceptor_(io_service_),
			new_connection_(),
			request_handler_(doc_root)
		{
			// Register to handle the signals that indicate when the server should exit.
			// It is safe to register for the same signal multiple times in a program,
			// provided all registration for the specified signal is made through Asio.
			signals_.add(SIGINT);
			signals_.add(SIGTERM);
#if defined(SIGQUIT)
			signals_.add(SIGQUIT);
#endif // defined(SIGQUIT)

			do_await_stop();

			// Open the acceptor with the option to reuse the address (i.e. SO_REUSEADDR).
			asio::ip::tcp::resolver resolver(io_service_);
			asio::ip::tcp::endpoint endpoint = *resolver.resolve({ address, port });
			acceptor_.open(endpoint.protocol());
			acceptor_.set_option(asio::ip::tcp::acceptor::reuse_address(true));
			acceptor_.bind(endpoint);
			acceptor_.listen();

			do_accept();
		}

		void server::run()
		{
			// Create a pool of threads to run all of the io_contexts.
			std::vector<std::shared_ptr<asio::thread> > threads;
			for (std::size_t i = 0; i < thread_pool_size_; ++i)
			{
				std::shared_ptr<asio::thread> thread(new asio::thread(
					std::bind(static_cast<std::size_t(asio::io_service::*)(void)>(&asio::io_service::run), std::ref(io_service_))));
				threads.push_back(thread);
			}

			// Wait for all threads in the pool to exit.
			for (std::size_t i = 0; i < threads.size(); ++i)
				threads[i]->join();
		}

		void server::do_accept()
		{
			new_connection_.reset(new connection(io_service_, request_handler_));
			acceptor_.async_accept(new_connection_->socket(),
				[this](std::error_code ec)
			{
				// Check whether the server was stopped by a signal before this
				// completion handler had a chance to run.
				if (!acceptor_.is_open())
				{
					return;
				}

				if (!ec)
				{
					new_connection_->start();
				}
				do_accept();
			});
		}

		void server::do_await_stop()
		{
			signals_.async_wait(
				[this](std::error_code /*ec*/, int /*signo*/)
			{
				// The server is stopped by cancelling all outstanding asynchronous
				// operations. Once all operations have finished the io_service::run()
				// call will exit.
				io_service_.stop();
			});
		}

	} // namespace server
} // namespace http
